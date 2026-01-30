export const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('vi-VN') + 'đ';
};

export const formatNumber = (value: string): string => {
    const num = value.replace(/\D/g, '');
    return num ? parseInt(num, 10).toLocaleString('vi-VN') : '';
};

export const parseNumber = (value: string): number => {
    return parseInt(value.replace(/\D/g, '') || '0', 10);
};

export const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
};

export const formatDateVietnamese = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const getYesterdayDate = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
};

export const roundNumber = (num: number): number => {
    return Math.round(num);
};
