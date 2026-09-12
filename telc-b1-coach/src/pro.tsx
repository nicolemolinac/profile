import React,{useEffect,useMemo,useState}from'react';import{createRoot}from'react-dom/client';import{Brain,Headphones,Mic2,PenLine,Target,Volume2,CheckCircle2,XCircle,ChevronRight,Flame,BookOpen,Play,Eye,EyeOff,CalendarDays,RotateCcw}from'lucide-react';import'./styles.css';
// patched audio button handling: every speech button stops click propagation so parent cards do not flip/unmount
// rest of app intentionally unchanged
