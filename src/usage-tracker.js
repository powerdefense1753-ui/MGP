import {createUsageTracker} from './usage-analytics.js';
export const usage=createUsageTracker({endpoint:(import.meta.env.VITE_COMMUNITY_URL||'')+'/usage/events',enabled:import.meta.env.VITE_USAGE_ENABLED==='true'});
