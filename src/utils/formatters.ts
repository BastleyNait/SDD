export const formatTemperature = (value: number): string => `${value.toFixed(1)} °C`;
export const formatHumidity = (value: number): string => `${Math.round(value)} %`;
export const formatPrecipitation = (value: number): string => `${value.toFixed(1)} mm`;
