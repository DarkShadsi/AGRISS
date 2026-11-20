import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

// =========== THE SHARED PAGE CONTAINER THAT KEEPS CONTENT BELOW THE STATUS BAR ===========

export default function ScreenContainer({ children }: { children: ReactNode }) {
    return <SafeAreaView edges={['top']} className="flex-1 bg-page">{children}</SafeAreaView>;
}