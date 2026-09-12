while kill -0 $(ps | grep 'npm run build' | awk '{print $1}') 2>/dev/null; do sleep 1; done
