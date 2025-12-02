Performance and scaling notes (target: 2 cores, 2GB RAM)
性能与扩展说明（目标配置：2核CPU，2GB内存）

- Keep the application memory-light
  - Use SQLite for small deployments (already used). For heavier load, move to a light RDBMS (Postgres) but only if necessary.
  - Limit in-memory caches. Use short-lived objects and rely on DB for authoritative state.
- 保持应用内存轻量级
  - 小规模部署使用SQLite（已实现）。高负载时迁移至轻量级关系数据库（Postgres），但仅在必要时进行。
  - 限制内存缓存。使用短生命周期对象，依赖数据库作为权威状态源。

- WebSocket scaling
  - Use `eventlet` or `gevent` workers with Flask-SocketIO; prefer `eventlet` for lower memory per connection.
  - Limit connected sockets per process (e.g., 100-500) and use a small number of processes (2 workers on 2 cores).
  - If expecting >500 concurrent WS clients, introduce a message broker (Redis) and run multiple socket workers behind a lightweight reverse proxy.
- WebSocket 扩展方案
  - 在 Flask-SocketIO 中使用 `eventlet` 或 `gevent` 工作进程；优先选择 `eventlet` 以降低单连接内存占用。
  - 限制单进程连接数（例如100-500），使用少量进程（2核配置下2个工作进程）。
  - 若预期 >500 并发 WebSocket 客户端，引入消息代理（Redis），并在轻量级反向代理后运行多 Socket 工作进程。

- Connection & throughput controls
  - Implement per-IP and per-user rate limits (message per second) at application level. Keep default limits conservative (e.g., 2s per message) to protect CPU.
  - Batch broadcast events: when many events occur in a short span, coalesce updates where possible.
- 连接与吞吐量控制
  - 在应用层实现每IP/每用户的速率限制（消息/秒）。默认限制需保守（例如每条消息间隔2秒）以保护CPU。
  - 批量广播事件：短时间高频率事件时，尽可能合并更新。

- Database and message handling
  - Paginate chat history and only return last N messages (configured, e.g., 50). Use indexes on timestamp and room_id (already present).
  - Periodically VACUUM and `PRAGMA optimize` on SQLite during low traffic windows.
  - Archive old messages to a separate table/file if history grows large.
- 数据库与消息处理
  - 聊天历史分页返回，仅提供最近N条消息（可配置，例如50条）。确保timestamp和room_id字段索引有效（已存在）。
  - 低峰期定期执行 SQLite 的 VACUUM 和 `PRAGMA optimize`。
  - 历史数据过大时，将旧消息归档至独立表/文件。

- Memory and CPU optimizations
  - Avoid heavy template rendering on every request — render minimal JSON for API endpoints and let client render.
  - Limit number of active JS libraries on client; lazy-load `marked` and `katex` as currently implemented.
  - Keep message rendering simple on server side; client-side rendering (Markdown -> HTML) is preferable.
- 内存与CPU优化
  - 避免每次请求进行重型模板渲染——API端点仅返回精简JSON，由客户端渲染。
  - 限制客户端活跃JS库数量；按当前方案懒加载 `marked` 和 `katex`。
  - 服务端保持消息渲染逻辑简单；优先采用客户端渲染（Markdown转HTML）。

- Static assets and network
  - Serve static assets (CSS/JS/images) via a CDN or a lightweight reverse proxy (nginx). Minify and combine assets.
  - Use caching headers for static assets.
- 静态资源与网络
  - 通过CDN或轻量级反向代理（nginx）提供静态资源（CSS/JS/图片）。压缩并合并资源文件。
  - 为静态资源设置缓存头。

- Operational
  - Run behind `nginx` as a reverse proxy to handle TLS, GZIP, and client buffering; use `uwsgi` or `gunicorn` with `eventlet` worker for Flask-SocketIO.
  - Monitor memory and file descriptors; set max clients accordingly.
  - Provide an endpoint for graceful restart and healthchecks (`/api/admin/system-info` exists).
- 运维部署
  - 通过 `nginx` 反向代理处理 TLS、GZIP 和客户端缓冲；Flask-SocketIO 使用 `uwsgi`/`gunicorn` 搭配 `eventlet` 工作进程。
  - 监控内存与文件描述符；据此设置最大客户端连接数。
  - 提供优雅重启与健康检查端点（已有 `/api/admin/system-info`）。

- Quick config suggestions for 2 cores / 2GB
  - Python process: 1-2 workers with `eventlet` (1 worker per core), low concurrency per worker (tune keepalive), limit per-process memory to ~900MB.
  - DB: SQLite is OK for small groups; enable WAL mode for concurrency: `PRAGMA journal_mode=WAL;` and `PRAGMA synchronous=NORMAL;`.
  - SocketIO: keep transports to `websocket` preferred, fallback to `polling` as implemented.
- 2核/2GB快速配置建议
  - Python进程：1-2个 `eventlet` 工作进程（每核1个），低并发配置（调整keepalive），单进程内存限制约900MB。
  - 数据库：小规模场景可用SQLite；启用WAL模式提升并发：`PRAGMA journal_mode=WAL;` 和 `PRAGMA synchronous=NORMAL;`。
  - SocketIO：优先使用 `websocket` 传输，按当前实现保留 `polling` 回退机制。

These recommendations are intentionally conservative to keep resource usage small while providing reasonable UX under concurrent load.
这些建议刻意保持保守，在并发负载下以较小资源占用提供合理用户体验。