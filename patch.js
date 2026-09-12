const fs = require('fs');
let content = fs.readFileSync('src/lib/erpStore.ts', 'utf8');

const approveFn = `
  const approveCashHandover = (id: string) => {
    updateDoc(doc(db, 'cashClosings', id), { status: 'Approved' }).catch((err) =>
      console.error('Firestore approveCashHandover error:', err)
    );
  };
`;
content = content.replace('  // Supplier Operations', approveFn + '\n  // Supplier Operations');
content = content.replace('recordCashClosing,', 'recordCashClosing,\n    approveCashHandover,');
fs.writeFileSync('src/lib/erpStore.ts', content);
