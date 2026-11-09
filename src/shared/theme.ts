export const COLORS = {
    primary: '#1F4E3D', primarySoft: '#E3F0E9', accent: '#129B64',
    page: '#F7F8F5', surface: '#FFFFFF', ink: '#1B1B1B', muted: '#4B5563',
    line: '#C9D1CC', danger: '#B42318',
    harvest: '#A94A00', fertilize: '#1A5A9E', custom: '#374151',
} as const;

export const FONT = {
    regular: 'Nunito_400Regular',
    semibold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
} as const;

export const SIZE = { display: 32, heading: 24, subheading: 20, body: 18, label: 16 } as const;

export const TEXT_SCALE = 1;          // a future in-app text-size setting changes this
export const MIN_TOUCH = 56;          // minimum button height in dp
export const UNDO_DURATION_MS = 5000; // Undo message stays 5 seconds