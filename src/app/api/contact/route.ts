import { Resend } from "resend";
import { z } from "zod";

/**
 * 联系表单 API —— 消息通过 Resend 邮件服务发到你邮箱（原项目同款方案）。
 *
 * 前置配置（见 .env.example）：
 *   RESEND_API_KEY  resend.com 注册后获取（免费 100 封/天）
 *   CONTACT_TO      收件邮箱，即你的邮箱
 * 没配 Key 时返回 503 + email_not_configured，前端会降级为 mailto 引导，
 * 站点不会因为没配置而看起来坏了。
 *
 * 免域名说明：Resend 未验证域名时只允许用 onboarding@resend.dev 发件、
 * 且只能发给注册 Resend 的那个邮箱——对个人站完全够用；以后有了自己的
 * 域名，改成 from: "Portfolio <no-reply@your-domain.com>" 即可。
 */

const Schema = z.object({
  name: z.string().min(2, "姓名至少 2 个字符"),
  email: z.string().email("邮箱格式不正确"),
  message: z.string().min(10, "留言至少 10 个字符"),
});

// 内存级 IP 限流：每分钟每 IP 最多 3 次（原项目同款）
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        { error: "email_not_configured" },
        { status: 503 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (isRateLimited(ip)) {
      return Response.json(
        { error: "发送太频繁，请一分钟后再试。" },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "参数不合法" },
        { status: 400 }
      );
    }

    const { name, email, message } = parsed.data;
    const to = process.env.CONTACT_TO;
    if (!to) {
      return Response.json({ error: "email_not_configured" }, { status: 503 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Portfolio <onboarding@resend.dev>",
      to: [to],
      replyTo: email, // 直接回复访客
      subject: `【个人主页留言】${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px">
          <h2 style="margin:0 0 12px">有人给你的个人主页留言了</h2>
          <p style="margin:4px 0"><b>姓名：</b>${name}</p>
          <p style="margin:4px 0"><b>邮箱：</b>${email}</p>
          <blockquote style="margin:12px 0;padding:12px 16px;background:#f4f4f5;border-left:3px solid #71717a;white-space:pre-wrap">${message.replace(
            /</g,
            "&lt;"
          )}</blockquote>
        </div>`,
    });

    if (error) {
      console.error("[contact] resend error:", error);
      return Response.json({ error: "邮件发送失败" }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error("[contact]", e);
    return Response.json({ error: "服务器错误" }, { status: 500 });
  }
}
