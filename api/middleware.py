import time
import logging
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from api.config import RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SECONDS

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # dict mapping IP to list of timestamps
        self.requests: defaultdict[str, list[float]] = defaultdict(list)

    def is_allowed(self, ip: str) -> bool:
        current_time = time.time()
        # Clean up old timestamps
        self.requests[ip] = [t for t in self.requests[ip] if current_time - t < self.window_seconds]
        
        if len(self.requests[ip]) >= self.max_requests:
            return False
            
        self.requests[ip].append(current_time)
        return True

rate_limiter = RateLimiter(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SECONDS)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            raise e
        finally:
            process_time = (time.perf_counter() - start_time) * 1000
            logger.info(
                f"method={request.method} path={request.url.path} status={status_code} latency_ms={process_time:.2f}"
            )
            
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "127.0.0.1"
        
        # Skip rate limiting for health check
        if request.url.path == "/health":
            return await call_next(request)
            
        if not rate_limiter.is_allowed(ip):
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return Response(
                content="Too Many Requests", 
                status_code=429,
                headers={"Retry-After": str(RATE_LIMIT_WINDOW_SECONDS)}
            )
            
        return await call_next(request)
