#!/bin/bash
SERVER_KEY='AAAA8dFXWdE:APA91bG9JLLAfunOANuyJEHf8Ak5rBUZ5EAN5fpxt_klXdj7lYdd0CFfnsmEUyK3TjEMZjqB3NduwCftrLqJJCprAG0Sw5kTPN--VFBF_KoB0R3xppFCRiaaI7YCVbrbFKKMpr2n0CKv'
DEVICE_REG_TOKEN='dwKoz9oRvoSspgstbbhCyu:APA91bFZJX69JfRVbESMlg_jcwCUCMGvFSVoTukfmfiWPTJ35EFOR9hIr7HGDEmxDndTpEr-uj5hnqBb0SpniYeou2kRtKzNOodhkpl_pX0W7J7zGfx0iKJvJbFuo_feOccHNyuUfrSw'

CMD=$(cat <<END
curl -X POST -H "Authorization: key=$SERVER_KEY" -H "Content-Type: application/json"
   -d '{
  "data": {
    "notification": {
        "title": "FCM Message",
        "body": "This is an FCM Message",
        "icon": "http://vomkar.droppages.com/icon.png",
    }
  },
  "to": "$DEVICE_REG_TOKEN"
}' https://fcm.googleapis.com/fcm/send
END
)

echo $CMD && eval $CMD
