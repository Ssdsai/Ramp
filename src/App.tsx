import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"
//import { setTransactionApproval } from "./utils/requests"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [transactionState, setTransactionState] = useState<Map<string, boolean>>(new Map())

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    setIsFilterLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsFilterLoading(false)

    await paginatedTransactionsUtils.fetchAll()
    setIsLoading(false)

    const storedState = localStorage.getItem("transactionState")
    if (storedState) {
      setTransactionState(new Map(JSON.parse(storedState)))
    } else if (transactions) {
      const initialState = new Map<string, boolean>()
      transactions.forEach((transaction) => {
        initialState.set(transaction.id, transaction.approved)
      })
      setTransactionState(initialState)
    }
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils, transactions])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  const handleTransactionChange = (transactionId: string, newValue: boolean) => {
    setTransactionState((prevState) => {
      const updatedState = new Map(prevState).set(transactionId, newValue)
      localStorage.setItem("transactionState", JSON.stringify([...updatedState]))
      return updatedState
    })
  }

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isFilterLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            if (newValue.id === "") {
              await loadAllTransactions()
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions
            transactions={transactions}
            approvedTransactions={transactionState}
            onTransactionApproval={handleTransactionChange}
          />

          {transactions !== null &&
            paginatedTransactions !== null &&
            paginatedTransactions.nextPage !== null && (
              <button
                className="RampButton"
                disabled={paginatedTransactionsUtils.loading}
                onClick={async () => {
                  await loadAllTransactions()
                }}
              >
                View More
              </button>
            )}
        </div>
      </main>
    </Fragment>
  )
}
