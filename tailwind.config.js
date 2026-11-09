/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            colors: {
                primary: { DEFAULT: '#1F4E3D', soft: '#E3F0E9' },
                accent: '#129B64',
                page: '#F7F8F5',
                surface: '#FFFFFF',
                ink: '#1B1B1B',
                muted: '#4B5563',
                line: '#C9D1CC',
                danger: '#B42318',
                harvest: '#A94A00',
                fertilize: '#1A5A9E',
                custom: '#374151',
            },
        },
    },
    plugins: [],
};