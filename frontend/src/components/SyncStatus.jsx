import React, { useState, useEffect } from 'react';
import { Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { networkService } from '../services/networkService';
import { queueService } from '../services/queueService';

export default function SyncStatus({ isDialogOpen = false }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasPendingOperations, setHasPendingOperations] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const checkQueue = async () => {
      const hasOperations = await queueService.hasOperations();
      setHasPendingOperations(hasOperations);
    };

    const handleNetworkChange = async (online) => {
      setIsOnline(online);
      if (online) {
        checkQueue();
      }
    };

    const handleQueueChange = () => {
      checkQueue();
    };

    const handleSyncChange = (syncing) => {
      setIsSyncing(syncing);
    };

    networkService.addListener(handleNetworkChange);
    networkService.addSyncListener(handleSyncChange);
    queueService.addQueueChangeListener(handleQueueChange);
    checkQueue();

    return () => {
      networkService.removeListener(handleNetworkChange);
      networkService.removeSyncListener(handleSyncChange);
      queueService.removeQueueChangeListener(handleQueueChange);
    };
  }, []);

  // Не отображаем уведомление, если открыт диалог
  if (isDialogOpen) {
    return null;
  }

  if (!isOnline) {
    return (
      <Alert variant="warning" className="mb-4">
        <AlertTitle>Нет подключения к интернету</AlertTitle>
        <AlertDescription>
          Ваши изменения будут сохранены локально и отправлены на сервер, как только появится подключение
        </AlertDescription>
      </Alert>
    );
  }

  if (hasPendingOperations && isSyncing) {
    return (
      <Alert variant="default" className="mb-4">
        <AlertTitle className="flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Синхронизация...
        </AlertTitle>
        <AlertDescription>
          Отправка сохраненных изменений на сервер
        </AlertDescription>
      </Alert>
    );
  }

  return null;
} 