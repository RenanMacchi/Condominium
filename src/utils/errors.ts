export function handleError(error: unknown, context: string): string {
    console.error(`[${context}]`, error)
    if (error instanceof Error) return error.message
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String((error as any).message)
    }
    return 'Erro desconhecido'
}
