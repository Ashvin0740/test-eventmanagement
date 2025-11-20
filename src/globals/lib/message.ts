interface ResponseMessage {
    code: number;
    message: string;
}

class MessageBuilder {
    private static readonly STATUS_CODES = {
        SUCCESS: 200, // OK
        BAD_REQUEST: 400, // Client-side validation or input issue
        UNAUTHORIZED: 401, // No or invalid auth
        FORBIDDEN: 403, // Authenticated but not allowed
        NOT_FOUND: 404, // Resource missing
        CONFLICT: 409, // Already exists or conflict
        UNPROCESSABLE: 422, // Validation or semantic error
        TOO_MANY_REQUESTS: 429, // Too many requests
        SERVER_ERROR: 500, // Internal server error
    } as const;

    readonly custom = {
        user_not_found: 'User not found',
        user_unauthorized: 'User is unauthorized',
        account_blocked: 'User account has been blocked',
        account_deleted: 'User account has been deleted',
        something_went_wrong(funName: string): string {
            return `[${funName}] :: Something went wrong`;
        },
    };

    successCM(message: string): ResponseMessage {
        return { code: MessageBuilder.STATUS_CODES.SUCCESS, message };
    }

    unauthorizedCM(message: string): ResponseMessage {
        return { code: MessageBuilder.STATUS_CODES.UNAUTHORIZED, message };
    }

    forbiddenCM(message: string): ResponseMessage {
        return { code: MessageBuilder.STATUS_CODES.FORBIDDEN, message };
    }

    notFoundCM(message: string): ResponseMessage {
        return { code: MessageBuilder.STATUS_CODES.NOT_FOUND, message };
    }

    badRequestCM(message: string): ResponseMessage {
        return { code: MessageBuilder.STATUS_CODES.BAD_REQUEST, message };
    }

    alreadyExistsCM(message: string): ResponseMessage {
        return { code: MessageBuilder.STATUS_CODES.CONFLICT, message };
    }

    unprocessableCM(message: string): ResponseMessage {
        return { code: MessageBuilder.STATUS_CODES.UNPROCESSABLE, message };
    }

    serverErrorCM(message: string): ResponseMessage {
        return { code: MessageBuilder.STATUS_CODES.SERVER_ERROR, message };
    }

    tooManyRequestsCM(message: string): ResponseMessage {
        return { code: MessageBuilder.STATUS_CODES.TOO_MANY_REQUESTS, message };
    }

    customCodeAndMessage(code: number, message: string): ResponseMessage {
        return { code, message };
    }
}

export type MessageBuilderType = MessageBuilder;
export default new MessageBuilder();
