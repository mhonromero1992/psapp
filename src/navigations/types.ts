import type {NavigatorScreenParams} from '@react-navigation/native';
import type {ClaimType, LoanProductId} from '../data/types';

export type TabParamList = {
  Home: undefined;
  Equity: undefined;
  Loans: undefined;
  Claims: undefined;
  More: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  Verify: undefined;
  Enrol: {agency?: string} | undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  LoanApply: {product?: LoanProductId} | undefined;
  LoanDetail: {id: string};
  ClaimNew: {type?: ClaimType} | undefined;
  ClaimDetail: {id: string};
  Payouts: undefined;
  Assist: undefined;
  Branches: undefined;
  Profile: undefined;
  Notifications: undefined;
};

declare global {

  namespace ReactNavigation {

    interface RootParamList extends RootStackParamList {}
  }
}
