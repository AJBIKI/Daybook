import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let active = true;

    NetInfo.fetch()
      .then((state) => {
        if (active) {
          setIsOnline(state.isConnected !== false);
        }
      })
      .catch(() => {});

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (active) {
        setIsOnline(state.isConnected !== false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return isOnline;
}
