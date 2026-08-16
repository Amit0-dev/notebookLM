export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly details?: unknown,
    ) {
        super(message)
        this.name = "AppError";
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(404, message);
        this.name = "NotFoundError";
    }
}

export class ValidationError extends AppError {
    constructor(message = "Validation failed", details?: unknown) {
        super(400, message, details);
        this.name = "ValidationError";
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(401, message);
        this.name = "UnauthorizedError";
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflict") {
        super(409, message);
        this.name = "ConflictError";
    }
}

export class ServerError extends AppError {
    constructor(message = "Internal server error") {
        super(500, message);
        this.name = "ServerError";
    }
}

export class InsufficientCreditsError extends AppError {
    constructor(message = "Insufficient credits. Please purchase more credits to continue.") {
        super(402, message);
        this.name = "InsufficientCreditsError";
    }
}