import AutoClaimTimer from './autoClaim'
import BtcDepositProcess from './btcDepositProcess'
import BtcWithdrawStatus from './btcWithdrawStatus'
import NextClearing from './nextClearing'
import TelegramLogin from './telegramLogin'
//import MixpanelBlockInterceptor from './mixpanelBlockInterceptor'

const Processes: React.FC = () => (
  <>
    <BtcDepositProcess />
    <BtcWithdrawStatus />
    <AutoClaimTimer />
    <TelegramLogin />
    <NextClearing />
  </>
)

export default Processes
