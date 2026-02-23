const walletAdapterChakraGlobal = `
.wallet-adapter-modal {
  z-index: 2000 !important;
}
.wallet-adapter-modal-title {
  color: var(--chakra-colors-grey-900) !important;
}
[data-theme='dark'] .wallet-adapter-modal-title {
  color: var(--chakra-colors-grey-100) !important;
}
.wallet-adapter-modal-wrapper {
  background-color: var(--chakra-colors-grey-100) !important;
  color: var(--chakra-colors-grey-900) !important;
  border-radius: 10px !important;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.1) !important;
}
.wallet-adapter-button {
  background-color: var(--chakra-colors-grey-100) !important;
  color: var(--chakra-colors-grey-900) !important;
  border: 1px solid var(--chakra-colors-grey-100) !important;
  border-radius: 4px !important;
  height: 48px !important;
  font-weight: 500 !important;
}
.wallet-adapter-button:hover {
  background-color: var(--chakra-colors-grey-200) !important;
}
.wallet-adapter-modal-list {
  background-color: var(--chakra-colors-grey-100) !important;
}
.wallet-adapter-modal-list .wallet-adapter-button {
  color: var(--chakra-colors-grey-900) !important;
}
.wallet-adapter-modal-list-more {
  color: var(--chakra-colors-grey-900) !important;
}
.wallet-adapter-modal-button-close {
  background-color: var(--chakra-colors-grey-200) !important;
}
.wallet-adapter-modal-button-close:hover svg {
  fill: var(--chakra-colors-grey-900) !important;
}
.wallet-adapter-dropdown-list {
  background-color: var(--chakra-colors-grey-100) !important;
  border: 1px solid var(--chakra-colors-grey-100) !important;
}
.wallet-adapter-dropdown-list-item {
  color: var(--chakra-colors-grey-900) !important;
}
.wallet-adapter-dropdown-list-item:hover {
  background-color: var(--chakra-colors-grey-200) !important;
}

/* Dark theme */
[data-theme='dark'] .wallet-adapter-modal-wrapper {
  background-color: var(--chakra-colors-grey-800) !important;
  color: var(--chakra-colors-grey-100) !important;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.3) !important;
}
[data-theme='dark'] .wallet-adapter-button {
  background-color: var(--chakra-colors-grey-800) !important;
  color: var(--chakra-colors-grey-100) !important;
  border: 1px solid var(--chakra-colors-grey-800) !important;
}
[data-theme='dark'] .wallet-adapter-button:hover {
  background-color: var(--chakra-colors-grey-600) !important;
}
[data-theme='dark'] .wallet-adapter-modal-list {
  background-color: var(--chakra-colors-grey-800) !important;
}
[data-theme='dark'] .wallet-adapter-modal-list .wallet-adapter-button {
  color: var(--chakra-colors-grey-100) !important;
}
[data-theme='dark'] .wallet-adapter-modal-list-more {
  color: var(--chakra-colors-grey-100) !important;
}
[data-theme='dark'] .wallet-adapter-modal-button-close {
  background-color: var(--chakra-colors-grey-700) !important;
}
[data-theme='dark'] .wallet-adapter-modal-button-close:hover svg {
  fill: var(--chakra-colors-grey-100) !important;
}
[data-theme='dark'] .wallet-adapter-dropdown-list {
  background-color: var(--chakra-colors-grey-800) !important;
  border: 1px solid var(--chakra-colors-grey-800) !important;
}
[data-theme='dark'] .wallet-adapter-dropdown-list-item {
  color: var(--chakra-colors-grey-100) !important;
}
[data-theme='dark'] .wallet-adapter-dropdown-list-item:hover {
  background-color: var(--chakra-colors-grey-800) !important;
}
`

export default walletAdapterChakraGlobal
