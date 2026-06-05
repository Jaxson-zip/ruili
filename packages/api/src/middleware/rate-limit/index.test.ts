import { describe, expect, it } from "vitest";
import { getClientKey, getTrustedIp } from "./index";

describe("rate-limit client key", () => {
	it("ignores forwarded IP headers unless proxy headers are explicitly trusted", () => {
		const headers = new Headers({
			"X-Forwarded-For": "198.51.100.10, 10.0.0.1",
			"X-Real-IP": "198.51.100.11",
			"User-Agent": "spoofable-browser",
			"Accept-Language": "zh-CN,zh;q=0.9",
		});

		expect(getTrustedIp(headers, { trustProxyHeaders: false })).toBeNull();
		expect(getClientKey(headers, { trustProxyHeaders: false })).toBe("anon:no-trusted-ip");
	});

	it("uses the first forwarded IP only when proxy headers are trusted", () => {
		const headers = new Headers({
			"X-Forwarded-For": "198.51.100.10, 10.0.0.1",
		});

		expect(getTrustedIp(headers, { trustProxyHeaders: true })).toBe("198.51.100.10");
		expect(getClientKey(headers, { trustProxyHeaders: true })).toBe("ip:198.51.100.10");
	});

	it("uses a single strict anonymous key when no trusted client IP exists", () => {
		const headers = new Headers({
			"User-Agent": "attacker-can-change-this",
			"Accept-Language": "en-US",
		});

		expect(getClientKey(headers, { trustProxyHeaders: false })).toBe("anon:no-trusted-ip");
		expect(getClientKey(undefined, { trustProxyHeaders: false })).toBe("anon:no-trusted-ip");
	});
});
