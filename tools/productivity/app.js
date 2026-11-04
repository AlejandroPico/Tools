import { workbench } from '../../core/workbench.js';
import { mountTasks, mountCards } from './lists.js';
import { mountBoard } from './board.js';
import { mountGraph } from './graph.js';
export function mountProductivity(root) { return workbench(root,{ tasks:'Tareas',cards:'Tarjetas',board:'Pizarra',mind:'Mapa mental',diagram:'Diagramas' },(id,panel,api) => id === 'tasks' ? mountTasks(panel,api) : id === 'cards' ? mountCards(panel,api) : id === 'board' ? mountBoard(panel,api) : mountGraph(panel,api,id === 'mind'),{ label:'Productividad',help:'Borradores en este navegador y documentos exportables para conservarlos o seguir editándolos.' }); }
