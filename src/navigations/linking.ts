import type {RootStackParamList, TabParamList} from './types';

type Route = {name: keyof RootStackParamList; params?: object};

/**
 * Notification links are written once, as paths shared with the web version ("/member/loans/LN-…").
 * This turns a path into the app screen that shows it.
 */
export function routeForLink(link: string | null | undefined): Route {
  if (!link) {return {name: 'Notifications'};}
  const parts = link.replace(/^\/member\/?/, '').split('/').filter(Boolean);
  const tab = (screen: keyof TabParamList): Route => ({name: 'Main', params: {screen}});
  switch (parts[0]) {
    case undefined:
      return tab('Home');
    case 'equity':
      return tab('Equity');
    case 'loans':
      return parts[1] && parts[1] !== 'apply' ? {name: 'LoanDetail', params: {id: parts[1]}} : parts[1] === 'apply' ? {name: 'LoanApply'} : tab('Loans');
    case 'claims':
      return parts[1] && parts[1] !== 'new' ? {name: 'ClaimDetail', params: {id: parts[1]}} : parts[1] === 'new' ? {name: 'ClaimNew'} : tab('Claims');
    case 'payouts':
      return {name: 'Payouts'};
    case 'assist':
      return {name: 'Assist'};
    case 'branches':
      return {name: 'Branches'};
    case 'profile':
      return {name: 'Profile'};
    default:
      return {name: 'Notifications'};
  }
}
