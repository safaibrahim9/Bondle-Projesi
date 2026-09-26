export class ProfileIdGenerator {
    static generate(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const part1 = this.randomString(4, chars);
        const part2 = this.randomString(4, chars);
        return `UV-${part1}-${part2}`;
    }

    private static randomString(length: number, charset: string): string {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }
}
