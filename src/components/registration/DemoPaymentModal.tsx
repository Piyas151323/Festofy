import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Smartphone,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  X,
  CreditCard,
  Info
} from 'lucide-react';
import { PaymentMethod } from '../../types';
import { Modal } from '../ui/Modal';

interface DemoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  eventName: string;
  categoryName?: string;
  onPaymentSuccess: (details: {
    method: PaymentMethod;
    transactionId: string;
    reference: string;
    paidAt: string;
    amount: number;
  }) => void;
}

export const DemoPaymentModal: React.FC<DemoPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  eventName,
  categoryName,
  onPaymentSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [senderNumber, setSenderNumber] = useState('01712345678');
  const [transactionId, setTransactionId] = useState('');
  const [reference, setReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentState, setPaymentState] = useState<'form' | 'success' | 'failed'>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generateDemoTrxId = () => {
    const prefix = selectedMethod === 'bkash' ? 'BK' : 'NG';
    const randomChars = Math.random().toString(36).substring(2, 10).toUpperCase();
    const generated = `${prefix}${randomChars}`;
    setTransactionId(generated);
    if (!reference) {
      setReference(`REG-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  const handleSimulatePayment = (shouldSucceed: boolean) => {
    if (!senderNumber.trim() || senderNumber.trim().length < 11) {
      setErrorMessage('Please enter an 11-digit demo mobile number.');
      return;
    }

    const finalTrx = transactionId.trim() || `${selectedMethod === 'bkash' ? 'BK' : 'NG'}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const finalRef = reference.trim() || `DEMO-${Date.now().toString().slice(-4)}`;

    setIsProcessing(true);
    setErrorMessage(null);

    // Realistic simulation latency
    setTimeout(() => {
      setIsProcessing(false);
      if (shouldSucceed) {
        setPaymentState('success');
        onPaymentSuccess({
          method: selectedMethod,
          transactionId: finalTrx,
          reference: finalRef,
          paidAt: new Date().toISOString(),
          amount
        });
      } else {
        setPaymentState('failed');
        setErrorMessage('Simulated transaction failed: Mock gateway rejected payment for testing failure handling.');
      }
    }, 1200);
  };

  const handleReset = () => {
    setPaymentState('form');
    setErrorMessage(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      hideCloseButton
    >
      {/* Environment Alert Header */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-3 flex items-center justify-between text-xs text-amber-300">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Simulated Demo Environment — No Real Money
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

        <div className="p-6 space-y-6">
          {/* Order Snapshot Header */}
          <div className="p-4 rounded-2xl bg-[#191b20] border border-[#242730] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#656c80] block">
                Competition Registration Fee
              </span>
              <h3 className="font-heading text-sm font-bold text-white truncate max-w-[260px]">
                {eventName}
              </h3>
              {categoryName && (
                <span className="text-[11px] text-[#ff4f1a] font-medium block">
                  Category: {categoryName}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-[#656c80] block">Payable Amount</span>
              <div className="font-heading text-2xl font-extrabold text-white">
                ৳{amount}
              </div>
            </div>
          </div>

          {paymentState === 'form' && (
            <div className="space-y-5">
              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Select Demo Payment Gateway
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMethod('bkash');
                      setTransactionId('');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      selectedMethod === 'bkash'
                        ? 'bg-[#E2136E]/15 border-[#E2136E] text-white shadow-lg shadow-[#E2136E]/10'
                        : 'bg-[#191b20] border-[#2e3442] text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#E2136E] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                      bK
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">Demo bKash</div>
                      <div className="text-[10px] text-zinc-400">Merchant Simulator</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMethod('nagad');
                      setTransactionId('');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      selectedMethod === 'nagad'
                        ? 'bg-[#F7921E]/15 border-[#F7921E] text-white shadow-lg shadow-[#F7921E]/10'
                        : 'bg-[#191b20] border-[#2e3442] text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#F7921E] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                      NG
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">Demo Nagad</div>
                      <div className="text-[10px] text-zinc-400">Post-paid Simulator</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Demo Inputs */}
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-[#ff4f1a]" />
                    <span>Demo Mobile Wallet Number</span>
                  </label>
                  <input
                    type="tel"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">
                      Simulated Transaction ID (TrxID)
                    </label>
                    <button
                      type="button"
                      onClick={generateDemoTrxId}
                      className="text-[11px] text-[#ff4f1a] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                    placeholder={`e.g. ${selectedMethod === 'bkash' ? 'BK8X92ML87' : 'NG9K28JL76'} (or leave blank to auto-create)`}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] font-mono text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">
                    Payment Reference / Note
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. Student Registration"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-xs text-red-200 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Simulation Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSimulatePayment(true)}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 rounded-xl font-heading text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Simulating Gateway...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simulate Payment Success (৳{amount})</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulatePayment(false)}
                  disabled={isProcessing}
                  className="py-3 px-3 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-300 bg-[#191b20] hover:bg-red-950/30 border border-[#2e3442] hover:border-red-900/60 transition-colors cursor-pointer"
                  title="Test failure state handling"
                >
                  Test Failure
                </button>
              </div>
            </div>
          )}

          {paymentState === 'success' && (
            <div className="text-center space-y-4 py-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading text-lg font-bold text-white">
                  Demo Payment Verified!
                </h4>
                <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
                  Your mock payment of <strong className="text-white">৳{amount}</strong> via <span className="capitalize text-white">{selectedMethod}</span> has been confirmed in the test sandbox.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-left text-xs font-mono space-y-1 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-[#656c80]">Provider:</span>
                  <span className="text-white font-bold uppercase">{selectedMethod} (Demo)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#656c80]">TrxID:</span>
                  <span className="text-emerald-400 font-bold">{transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#656c80]">Amount:</span>
                  <span className="text-white">৳{amount} BDT</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-5 rounded-xl font-heading text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors shadow-lg shadow-[#ff4f1a]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue Registration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {paymentState === 'failed' && (
            <div className="text-center space-y-4 py-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/40">
                <XCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading text-lg font-bold text-white">
                  Payment Simulation Failed
                </h4>
                <p className="text-xs text-red-300 max-w-sm mx-auto">
                  {errorMessage || 'Mock transaction declined. You can retry with a valid demo simulation.'}
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Retry Payment
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
    </Modal>
  );
};
