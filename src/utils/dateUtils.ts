import dayjs from "dayjs"; // Replace moment with dayjs

export const reverseDate = (date: string): string => {
    return dayjs(date, "YYYY-MM-DD").format("DD-MM-YYYY"); // Convert YYYY-MM-DD to DD-MM-YYYY
};
