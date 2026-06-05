# 可信代理 IP 头

生产环境默认保持：

```env
FLAG_TRUST_PROXY_HEADERS="false"
```

这个项目的匿名限流会用客户端 IP 做 key，但 `X-Forwarded-For`、`X-Real-IP` 这类请求头本身可以被用户伪造。只有满足下面条件时，才可以开启：

- 应用端口没有直接暴露到公网。
- 所有公网流量都必须经过 Cloudflare、Nginx、Caddy、1Panel 反向代理等可信入口。
- 可信入口会覆盖客户端传来的 `X-Forwarded-For`、`X-Real-IP` 等头，而不是原样透传。

满足后可以设置：

```env
FLAG_TRUST_PROXY_HEADERS="true"
```

如果不确定，就保持 `false`。这样匿名限流会更严格，但不会被伪造代理头绕过。

