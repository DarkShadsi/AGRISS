const fs = require('fs'), path = require('path');
const dirs = [
    'src/features/crops/ui', 'src/features/crops/services', 'src/features/crops/data',
    'src/features/tasks/ui', 'src/features/tasks/services', 'src/features/tasks/data',
    'src/features/sales/ui', 'src/features/sales/services', 'src/features/sales/data',
    'src/features/dashboard/ui',
    'src/core/database', 'src/shared/components', 'src/shared/utils',
    'assets/seed', 'docs/diagrams',
];
dirs.forEach(d => {
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, '.gitkeep'), '');
});