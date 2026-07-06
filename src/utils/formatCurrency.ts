export function formatCurrency(value: number): string{
    return new Intl.NumberFormat('en-CA',{
        style: "currency",
        currency: "CAD",

    }).format(value);
}