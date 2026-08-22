import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

/**
 * 留言板 API —— 双模式存储：
 *
 *   配置了 Upstash Redis（免费档）→ 留言持久保存，重启/多实例不丢；
 *   没配置 → 自动回落到内存模式（重启清空），保证站点永远可用。
 *
 * Redis 结构：
 *   guestbook:messages  list，JSON 序列化的消息，RPUSH 追加、保留最近 200 条
 *   guestbook:presence  sorted set，score=最后心跳时间戳(ms)、member=sessionId，
 *                       30 秒窗口内有心跳即算在线（ZCARD 统计人数）
 *
 * 配置（见 .env.example）：到 https://upstash.com 注册 → 建 Redis 数据库 →
 * 复制 REST URL 和 TOKEN 填进 .env.local，重启 dev server 即生效。
 */

type Message = {
  id: string;
  sessionId: string;
  name: string;
  color: string;
  /** 头像文件名（可空，旧数据没有） */
  avatar?: string;
  content: string;
  createdAt: number;
  type?: "system";
};

const MSG_KEY = "guestbook:messages";
const PRESENCE_KEY = "guestbook:presence";
/** hash：sessionId → JSON{name, color}，在线用户的展示信息 */
const USERS_KEY = "guestbook:users";
const ONLINE_WINDOW = 30_000;
const MAX_MESSAGES = 200;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const json = (data: unknown) =>
  NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });

// ---------- Redis 模式 ----------
// 所有命令尽量用 pipeline 打包：一次 HTTPS 往返执行多条命令，
// 从国内到东京节点这能把一次请求从 ~1s 压到 ~200ms

const redisSnapshot = async (
  sessionId: string,
  name: string,
  color: string,
  avatar: string
) => {
  const now = Date.now();

  // 第一批：心跳 + 记录展示信息 + 清理 + 判断是否首次（一次往返）
  // 注意：本版本 SDK 的 pipeline.exec() 直接返回结果数组（无 .result 包装）
  const batch1 = await redis!
    .pipeline()
    .zscore(PRESENCE_KEY, sessionId)
    .zadd(PRESENCE_KEY, { score: now, member: sessionId })
    .hset(USERS_KEY, {
      [sessionId]: JSON.stringify({ name, color, avatar }),
    })
    .zremrangebyscore(PRESENCE_KEY, "-inf", now - ONLINE_WINDOW)
    .llen(MSG_KEY)
    .exec();
  const isFirstHeartbeat = batch1[0] === null;
  const messageCount = Number(batch1[4] ?? 0);

  // 首次心跳插入加入系统消息（对齐原项目的 join 提示）
  if (isFirstHeartbeat && messageCount > 0) {
    const join: Message = {
      id: crypto.randomUUID(),
      sessionId,
      name,
      color,
      content: "",
      createdAt: Date.now(),
      type: "system",
    };
    await redis!.rpush(MSG_KEY, JSON.stringify(join));
  }

  // 第二批：取消息 + 在线名单 + 在线人数（一次往返，zcard 省掉——人数即名单长度）
  const batch2 = await redis!
    .pipeline()
    .lrange(MSG_KEY, -100, -1)
    .zrange(PRESENCE_KEY, 0, -1)
    .hgetall(USERS_KEY)
    .exec();
  const raw = (batch2[0] ?? []) as unknown[];
  // Upstash 客户端会把合法 JSON 自动反序列化成对象；旧数据/边界情况下
  // 也可能返回字符串，两种都兼容
  const messages = raw.map((s) =>
    typeof s === "string" ? (JSON.parse(s) as Message) : (s as Message)
  );

  const liveIds = (batch2[1] ?? []) as string[];
  const liveSet = new Set(liveIds);
  // hgetall 可能返回对象或扁平数组（SDK 版本差异），两种都兼容
  const rawHash = batch2[2] as unknown;
  const hash: Record<string, string> = Array.isArray(rawHash)
    ? Object.fromEntries(
        (rawHash as string[]).reduce<[string, string][]>((acc, v, i, arr) => {
          if (i % 2 === 1) acc.push([arr[i - 1], v]);
          return acc;
        }, [])
      )
    : ((rawHash as Record<string, string>) ?? {});

  const users = liveIds.map((id) => {
    // hash 值可能是对象（自动反序列化）或字符串（含双重序列化的边界），全兼容
    const info = (() => {
      try {
        const raw = hash[id];
        if (!raw) return {};
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
      } catch {
        return {};
      }
    })();
    return {
      sessionId: id,
      name: info.name || "Guest",
      color: info.color || "#5865f2",
      avatar: info.avatar || undefined,
    };
  });

  // 惰性清理：hash 里堆积的已离线用户超过阈值时删一轮（不增加常规往返）
  const stale = Object.keys(hash).filter((id) => !liveSet.has(id));
  if (stale.length > 50) {
    redis!.hdel(USERS_KEY, ...stale).catch(() => {});
  }

  return { messages, onlineCount: users.length, users };
};

const redisAppend = async (msg: Message) => {
  const now = Date.now();
  await redis!
    .pipeline()
    .zadd(PRESENCE_KEY, { score: now, member: msg.sessionId })
    .zremrangebyscore(PRESENCE_KEY, "-inf", now - ONLINE_WINDOW)
    .rpush(MSG_KEY, JSON.stringify(msg))
    .ltrim(MSG_KEY, -MAX_MESSAGES, -1)
    .exec();
};

// ---------- 内存回落模式（未配置 Redis 时） ----------

const messages: Message[] = [];
const presence = new Map<string, number>();
/** sessionId → {name, color, avatar}（内存模式的在线用户展示信息） */
const usersInfo = new Map<string, { name: string; color: string; avatar?: string }>();

const prunePresence = () => {
  const now = Date.now();
  for (const [id, seen] of presence) {
    if (now - seen > ONLINE_WINDOW) presence.delete(id);
  }
};

const memorySnapshot = (
  sessionId: string,
  name: string,
  color: string,
  avatar: string
): {
  messages: Message[];
  onlineCount: number;
  users: { sessionId: string; name: string; color: string; avatar?: string }[];
} => {
  const known = presence.has(sessionId);
  presence.set(sessionId, Date.now());
  usersInfo.set(sessionId, { name, color, avatar: avatar || undefined });
  prunePresence();
  if (!known && messages.length > 0) {
    messages.push({
      id: crypto.randomUUID(),
      sessionId,
      name,
      color,
      content: "",
      createdAt: Date.now(),
      type: "system",
    });
  }
  const users = [...presence.keys()].map((id) => ({
    sessionId: id,
    ...(usersInfo.get(id) ?? { name: "Guest", color: "#5865f2" }),
  }));
  return { messages: messages.slice(-100), onlineCount: users.length, users };
};

const memoryAppend = (msg: Message) => {
  presence.set(msg.sessionId, Date.now());
  prunePresence();
  messages.push(msg);
  if (messages.length > MAX_MESSAGES) {
    messages.splice(0, messages.length - MAX_MESSAGES);
  }
};

// ---------- 路由 ----------

/** GET：心跳 + 拉取消息与在线人数。?sessionId= 必传 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return json({ error: "sessionId required" });

  const name = req.nextUrl.searchParams.get("name") || "Guest";
  const color = req.nextUrl.searchParams.get("color") || "#5865f2";
  const avatar = (req.nextUrl.searchParams.get("avatar") || "").slice(0, 64);

  if (redis) {
    try {
      return json(await redisSnapshot(sessionId, name, color, avatar));
    } catch (e) {
      console.error("[guestbook] redis GET failed, falling back:", e);
    }
  }
  return json(memorySnapshot(sessionId, name, color, avatar));
}

/** POST：发留言 { sessionId, name, color, content } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { sessionId, name, color, content } = body ?? {};

  const cleanContent = typeof content === "string" ? content.trim() : "";
  const cleanName = typeof name === "string" ? name.trim().slice(0, 24) : "";

  if (!sessionId || !cleanContent || !cleanName) {
    return NextResponse.json(
      { error: "sessionId, name, content required" },
      { status: 400 }
    );
  }
  if (cleanContent.length > 500) {
    return NextResponse.json({ error: "message too long" }, { status: 400 });
  }

  const msg: Message = {
    id: crypto.randomUUID(),
    sessionId,
    name: cleanName,
    color: typeof color === "string" ? color : "#5865f2",
    avatar:
      typeof body.avatar === "string" && body.avatar ? body.avatar.slice(0, 64) : undefined,
    content: cleanContent,
    createdAt: Date.now(),
  };

  if (redis) {
    try {
      await redisAppend(msg);
      return json({ ok: true, storage: "redis" });
    } catch (e) {
      console.error("[guestbook] redis POST failed, falling back:", e);
    }
  }
  memoryAppend(msg);
  return json({ ok: true, storage: "memory" });
}
