import { FunctionComponent } from "react"
import { Transaction } from "../../utils/types"

export type SetTransactionApprovalFunction = (params: {
  transactionId: string
  newValue: boolean
}) => Promise<void>

type TransactionsProps = {
  transactions: Transaction[] | null
  approvedTransactions: Map<string, boolean>
  onTransactionApproval: (transactionId: string, newValue: boolean) => void
}

type TransactionPaneProps = {
  transaction: Transaction
  loading: boolean
  approved?: boolean
  setTransactionApproval: SetTransactionApprovalFunction
  approvedTransactions: Map<string, boolean>
  onTransactionApproval: (transactionId: string, newValue: boolean) => void
}

export type TransactionsComponent = FunctionComponent<TransactionsProps>
export type TransactionPaneComponent = FunctionComponent<TransactionPaneProps>
