const fs = require('fs');
const content = fs.readFileSync('src/app/team/team-client.tsx', 'utf8');

let newContent = content.replace(
  `    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col h-full group">`,
  `    <div className="glass-panel rounded-3xl p-6 flex flex-col h-full group">`
);

// EmployeeCard editing input
newContent = newContent.replace(
  `            className="w-full p-2 border rounded font-semibold bg-blue-50/50"`,
  `            className="w-full p-2 border border-white/20 rounded font-semibold bg-white/10 text-white placeholder-slate-300 outline-none focus:border-white/40"`
);

// EmployeeCard icon
newContent = newContent.replace(
  `              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg flex-shrink-0">`,
  `              <div className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-inner border border-white/10">`
);

// EmployeeCard title
newContent = newContent.replace(
  `              <h2 className="text-xl font-semibold text-gray-900">{roleHolder.name}</h2>`,
  `              <h2 className="text-xl font-semibold text-white drop-shadow-sm">{roleHolder.name}</h2>`
);

// EmployeeCard action buttons (Edit/Delete)
newContent = newContent.replace(
  `                <button onClick={() => setIsEditing(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="ערוך"><Edit2 className="w-4 h-4" /></button>`,
  `                <button onClick={() => setIsEditing(true)} className="p-1.5 text-blue-300 hover:bg-white/10 hover:text-blue-200 rounded transition-colors" title="ערוך"><Edit2 className="w-4 h-4" /></button>`
);
newContent = newContent.replace(
  `                <button onClick={async () => { `,
  `                <button onClick={async () => { `
);
newContent = newContent.replace(
  `                }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="מחק"><Trash2 className="w-4 h-4" /></button>`,
  `                }} className="p-1.5 text-red-400 hover:bg-white/10 hover:text-red-300 rounded transition-colors" title="מחק"><Trash2 className="w-4 h-4" /></button>`
);

// Task editing text area
newContent = newContent.replace(
  `                     className="w-full p-2 border rounded text-sm min-h-[40px]"`,
  `                     className="w-full p-2 border border-white/20 rounded text-sm min-h-[40px] bg-white/10 text-white outline-none focus:border-white/40"`
);

// Task background layer
newContent = newContent.replace(
  `              {/* Background layer */}
              <div className={\`absolute inset-0 rounded-lg z-0 \${
                connectMode ? 'group-hover/task:bg-blue-50 border border-transparent group-hover/task:border-blue-200' : ''
              } \${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-50'
              }\`} />`,
  `              {/* Background layer */}
              <div className={\`absolute inset-0 rounded-lg z-0 transition-colors \${
                connectMode ? 'group-hover/task:bg-white/10 border border-transparent group-hover/task:border-white/20' : ''
              } \${
                isSelected ? 'ring-2 ring-blue-400 bg-white/20' : 'bg-white/5 border border-white/5'
              }\`} />`
);

// Task CheckCircle2 icon
newContent = newContent.replace(
  `                  <div id={\`task-icon-\${task.id}\`} className="flex-shrink-0 mt-0.5 relative z-20 rounded-full bg-white">
                    <CheckCircle2 className={\`w-4 h-4 \${connectMode ? 'text-blue-400' : 'text-gray-400'}\`} />
                  </div>`,
  `                  <div id={\`task-icon-\${task.id}\`} className="flex-shrink-0 mt-0.5 relative z-20 rounded-full bg-transparent">
                    <CheckCircle2 className={\`w-4 h-4 \${connectMode ? 'text-blue-300' : 'text-slate-300'}\`} />
                  </div>`
);

// Task text
newContent = newContent.replace(
  `                  <span className={\`text-sm text-gray-700 leading-relaxed relative z-20 font-medium px-1 rounded \${
                    connectMode ? 'group-hover/task:bg-blue-50' : ''
                  } \${
                    isSelected ? 'bg-blue-50' : 'bg-gray-50'
                  }\`}>{task.description}</span>`,
  `                  <span className={\`text-sm text-slate-100 leading-relaxed relative z-20 font-medium px-1\`}>{task.description}</span>`
);

// Task edit/delete overlay
newContent = newContent.replace(
  `                      <button onClick={(e) => { e.stopPropagation(); setTaskEditValue(task.description); setEditingTaskId(task.id); }} className="p-1 text-blue-600 hover:bg-blue-100 rounded bg-white/80" title="ערוך משימה"><Edit2 className="w-3 h-3" /></button>`,
  `                      <button onClick={(e) => { e.stopPropagation(); setTaskEditValue(task.description); setEditingTaskId(task.id); }} className="p-1 text-blue-300 hover:bg-white/20 rounded bg-white/10 backdrop-blur-sm" title="ערוך משימה"><Edit2 className="w-3 h-3" /></button>`
);
newContent = newContent.replace(
  `                      }} className="p-1 text-red-600 hover:bg-red-100 rounded bg-white/80" title="מחק משימה"><Trash2 className="w-3 h-3" /></button>`,
  `                      }} className="p-1 text-red-400 hover:bg-white/20 rounded bg-white/10 backdrop-blur-sm" title="מחק משימה"><Trash2 className="w-3 h-3" /></button>`
);

// Add task area
newContent = newContent.replace(
  `             <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
               <textarea 
                 value={newTaskValue} 
                 onChange={e => setNewTaskValue(e.target.value)} 
                 className="w-full p-2 border rounded text-sm min-h-[40px] bg-white"
                 placeholder="תיאור משימה חדשה..."
                 autoFocus
               />`,
  `             <div className="flex flex-col gap-2 p-3 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
               <textarea 
                 value={newTaskValue} 
                 onChange={e => setNewTaskValue(e.target.value)} 
                 className="w-full p-2 border border-white/20 rounded text-sm min-h-[40px] bg-white/10 text-white placeholder-slate-300 outline-none focus:border-white/40"
                 placeholder="תיאור משימה חדשה..."
                 autoFocus
               />`
);
newContent = newContent.replace(
  `             <button onClick={() => setIsAddingTask(true)} className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full py-2 rounded-lg font-medium transition-colors">`,
  `             <button onClick={() => setIsAddingTask(true)} className="flex items-center justify-center gap-1 text-sm text-blue-200 hover:text-white hover:bg-white/10 w-full py-2 rounded-lg font-medium transition-colors">`
);

// Main layout wrapper
newContent = newContent.replace(
  `    <div className="p-4 md:p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">בעלי תפקידים וצוות</h1>
        <p className="text-muted-foreground mt-2">צפייה בתחומי האחריות ומשימות של חברי הצוות.</p>
      </div>`,
  `    <div className="p-4 md:p-8 min-h-screen" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto">
        <div className="lg:col-span-12 glass-panel rounded-3xl p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">בעלי תפקידים וצוות</h1>
              <p className="text-slate-200 mt-2">צפייה בתחומי האחריות ומשימות של חברי הצוות.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white drop-shadow-md">{allCards.length}</span>
            <span className="text-slate-200 mt-2 text-sm font-medium">בעלי תפקידים</span>
          </div>
          <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white drop-shadow-md">{Object.values(normalizedGroupedTasks).flat().length}</span>
            <span className="text-slate-200 mt-2 text-sm font-medium">משימות פעילות</span>
          </div>
          <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white drop-shadow-md">{connections.length}</span>
            <span className="text-slate-200 mt-2 text-sm font-medium">קשרים בין משימות</span>
          </div>
        </div>`
);

// End wrapper
newContent = newContent.replace(
  `      <Xwrapper>
        {allCards.length === 0 && !isAddingNew ? (`,
  `      <div className="lg:col-span-12">
        <Xwrapper>
          {allCards.length === 0 && !isAddingNew ? (`
);

newContent = newContent.replace(
  `          <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground shadow-sm">
            <p>אין נתונים על בעלי תפקידים.</p>`,
  `          <div className="glass-panel rounded-3xl p-12 text-center text-slate-200 shadow-sm">
            <p>אין נתונים על בעלי תפקידים.</p>`
);

newContent = newContent.replace(
  `                <button
                  onClick={() => { setConnectMode(!connectMode); setSelectedTask(null); }}
                  className={\`flex items-center gap-2 px-4 py-2 rounded-lg transition-all \${
                    connectMode 
                      ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                      : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }\`}
                >`,
  `                <button
                  onClick={() => { setConnectMode(!connectMode); setSelectedTask(null); }}
                  className={\`flex items-center gap-2 px-4 py-2 rounded-xl transition-all \${
                    connectMode 
                      ? 'bg-blue-500/80 text-white shadow-md hover:bg-blue-500' 
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  }\`}
                >`
);

newContent = newContent.replace(
  `                {connectMode && (
                  <p className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg animate-pulse">`,
  `                {connectMode && (
                  <p className="text-sm font-medium text-blue-100 bg-blue-900/40 border border-blue-500/30 px-4 py-2 rounded-xl animate-pulse">`
);

newContent = newContent.replace(
  `                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full md:w-auto justify-center"
                >`,
  `                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center gap-2 bg-white/10 text-white border border-white/20 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors w-full md:w-auto justify-center"
                >`
);

newContent = newContent.replace(
  `              {isAddingNew && (
                <div className="bg-white rounded-xl border-2 border-dashed border-blue-300 shadow-sm p-6 flex flex-col h-full bg-blue-50/20">
                  <div className="mb-6 space-y-3 relative z-30">
                    <input 
                      value={newRole.name} 
                      onChange={e => setNewRole({...newRole, name: e.target.value})} 
                      className="w-full p-2 border rounded font-semibold bg-white" 
                      placeholder="שם עובד"
                      autoFocus
                    />`,
  `              {isAddingNew && (
                <div className="glass-panel rounded-3xl border-2 border-dashed border-white/30 shadow-sm p-6 flex flex-col h-full bg-white/5">
                  <div className="mb-6 space-y-3 relative z-30">
                    <input 
                      value={newRole.name} 
                      onChange={e => setNewRole({...newRole, name: e.target.value})} 
                      className="w-full p-2 border border-white/20 rounded font-semibold bg-white/10 text-white placeholder-slate-300 outline-none focus:border-white/40" 
                      placeholder="שם עובד"
                      autoFocus
                    />`
);

newContent = newContent.replace(
  `                      color="#94a3b8"`,
  `                      color="rgba(255,255,255,0.4)"`
);

newContent = newContent.replace(
  `                          className="bg-white p-1 rounded-full shadow-sm border cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors pointer-events-auto"`,
  `                          className="bg-white/10 p-1 rounded-full shadow-sm border border-white/20 cursor-pointer hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 text-slate-300 backdrop-blur-sm transition-colors pointer-events-auto"`
);

newContent = newContent.replace(
  `        )}
      </Xwrapper>
    </div>`,
  `          )}
        </Xwrapper>
      </div>
    </div>
  </div>`
);

fs.writeFileSync('src/app/team/team-client.tsx', newContent);
