export declare class HomeController {
    summary(req: {
        user: {
            role_name: string;
            username: string;
        };
    }): {
        role: string;
        title: string;
        subtitle: string;
        raw_role?: undefined;
    } | {
        role: string;
        title: string;
        subtitle: string;
        raw_role: string;
    };
}
