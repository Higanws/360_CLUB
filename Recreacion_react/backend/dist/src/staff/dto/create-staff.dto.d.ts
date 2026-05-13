export declare class CreateStaffDto {
    first_name: string;
    middle_name?: string;
    last_name: string;
    gender: 'male' | 'female' | 'other';
    birth_date: string;
    role: number;
    specialization_ids: number[];
    address: string;
    city: string;
    state?: string;
    zipcode?: string;
    mobile: string;
    phone?: string;
    email: string;
    username: string;
    password: string;
}
