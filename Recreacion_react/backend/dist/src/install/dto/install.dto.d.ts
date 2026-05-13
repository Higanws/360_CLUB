export declare class TestDbDto {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
}
export declare class RunInstallDto extends TestDbDto {
    adminUsername: string;
    adminPassword: string;
}
