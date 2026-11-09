import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenContainer({ children }: { children: ReactNode }) {
    return <SafeAreaView edges={['top']} className="flex-1 bg-page">{children}</SafeAreaView>;
}