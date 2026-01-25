import { json } from "@sveltejs/kit";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";

export interface DbErrorResponse {
  error: string;
  code?: string;
}

export function isDatabaseConnectionError(error: unknown): boolean {
  if (error instanceof PrismaClientInitializationError) {
    return true;
  }
  if (error instanceof PrismaClientKnownRequestError) {
    // P1001: Can't reach database server
    // P1002: Database server timed out
    // P1003: Database does not exist
    // P1008: Operations timed out
    // P1017: Server has closed the connection
    const connectionErrors = ['P1001', 'P1002', 'P1003', 'P1008', 'P1017'];
    return connectionErrors.includes(error.code);
  }
  return false;
}

export function handleDatabaseError(error: unknown, operation: string) {
  if (isDatabaseConnectionError(error)) {
    console.error(`Database unavailable during ${operation}:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    return json(
      { error: "Service temporarily unavailable", code: "DB_UNAVAILABLE" } as DbErrorResponse,
      { status: 503 }
    );
  }

  if (error instanceof PrismaClientKnownRequestError) {
    console.error(`Database error during ${operation}:`, error.code, error.message);

    // Handle specific known errors
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return json(
          { error: "Resource already exists", code: "DUPLICATE" } as DbErrorResponse,
          { status: 409 }
        );
      case 'P2025': // Record not found
        return json(
          { error: "Resource not found", code: "NOT_FOUND" } as DbErrorResponse,
          { status: 404 }
        );
      default:
        return json(
          { error: `Failed to ${operation}`, code: "DB_ERROR" } as DbErrorResponse,
          { status: 500 }
        );
    }
  }

  if (error instanceof PrismaClientValidationError) {
    console.error(`Validation error during ${operation}:`, error.message);
    return json(
      { error: "Invalid request data", code: "VALIDATION_ERROR" } as DbErrorResponse,
      { status: 400 }
    );
  }

  // Generic error
  console.error(`Error during ${operation}:`, error);
  return json(
    { error: `Failed to ${operation}` } as DbErrorResponse,
    { status: 500 }
  );
}
