import { derived, get, writable } from 'svelte/store';
import { supabase } from '$lib/supabase.js';
import { showNotification } from './notificationStore.js';

export const loans = writable([]);
export const loanUpdates = writable([]);
export const oneTimePayments = writable([]);
export const balanceAdjustments = writable([]);
export const isLoading = writable(false);
export const editingLoan = writable(null);
export const expandedLoanId = writable(null);
export const isSubmittingForm = writable(false);

export const loanList = derived(loans, ($loans) => $loans);
export const loading = derived(isLoading, ($isLoading) => $isLoading);
export const isEditing = derived(editingLoan, ($editingLoan) => !!$editingLoan);

async function currentUser() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('You are not logged in.');
  return data.user;
}

async function reloadLoans() {
  const { data, error } = await supabase.from('loans').select('*').order('start_date', { ascending: true });
  if (error) throw error;
  loans.set(data || []);
  return data || [];
}

async function reloadRelatedData() {
  const [updatesRes, paymentsRes, balancesRes] = await Promise.all([
    supabase.from('loan_updates').select('*').order('update_date', { ascending: true }),
    supabase.from('one_time_payments').select('*').order('payment_date', { ascending: true }),
    supabase.from('loan_balance_adjustments').select('*').order('adjustment_date', { ascending: true })
  ]);
  if (updatesRes.error) throw updatesRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  if (balancesRes.error) throw balancesRes.error;
  loanUpdates.set(updatesRes.data || []);
  oneTimePayments.set(paymentsRes.data || []);
  balanceAdjustments.set(balancesRes.data || []);
  return {
    updates: updatesRes.data || [],
    payments: paymentsRes.data || [],
    balances: balancesRes.data || []
  };
}

export const loanService = {
  async fetchAllLoans() {
    isLoading.set(true);
    try {
      if (!supabase) throw new Error('Supabase is not configured.');
      return await reloadLoans();
    } catch (error) {
      showNotification(`Failed to load loans: ${error.message}`, 'error');
      throw error;
    } finally {
      isLoading.set(false);
    }
  },

  async createLoan(loanData) {
    isSubmittingForm.set(true);
    try {
      const user = await currentUser();
      const payload = {
        user_id: user.id,
        name: loanData.name?.trim() || `Loan ${get(loans).length + 1}`,
        start_sum: Number(loanData.startAmount),
        interest_rate: Number(loanData.interestRate),
        amortization: Number(loanData.monthlyPayment),
        start_date: loanData.startDate
      };
      const { data, error } = await supabase.from('loans').insert(payload).select().single();
      if (error) throw error;
      await reloadLoans();
      showNotification('Loan created successfully!', 'success');
      return data;
    } catch (error) {
      showNotification(`Failed to save loan: ${error.message}`, 'error');
      throw error;
    } finally {
      isSubmittingForm.set(false);
    }
  },

  async updateLoan(loanId, loanData) {
    isSubmittingForm.set(true);
    try {
      const user = await currentUser();
      const payload = {
        name: loanData.name?.trim() || 'Loan',
        start_sum: Number(loanData.startAmount),
        interest_rate: Number(loanData.interestRate),
        amortization: Number(loanData.monthlyPayment),
        start_date: loanData.startDate,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('loans').update(payload).eq('id', loanId).eq('user_id', user.id);
      if (error) throw error;
      await reloadLoans();
      editingLoan.set(null);
      showNotification('Loan updated successfully!', 'success');
      return true;
    } catch (error) {
      showNotification(`Failed to save loan: ${error.message}`, 'error');
      throw error;
    } finally {
      isSubmittingForm.set(false);
    }
  },

  async deleteLoan(loanId) {
    try {
      const user = await currentUser();
      const { error } = await supabase.from('loans').delete().eq('id', loanId).eq('user_id', user.id);
      if (error) throw error;
      await reloadLoans();
      loanUpdates.set([]); oneTimePayments.set([]); balanceAdjustments.set([]);
      if (get(editingLoan)?.id === loanId) editingLoan.set(null);
      if (get(expandedLoanId) === loanId) expandedLoanId.set(null);
      showNotification('Loan deleted successfully!', 'success');
      return true;
    } catch (error) {
      showNotification(`Failed to delete loan: ${error.message}`, 'error');
      throw error;
    }
  }
};

export const loanUpdateService = {
  async fetchLoanUpdates(loanId) {
    const { data, error } = await supabase.from('loan_updates').select('*').eq('loan_id', loanId).order('update_date', { ascending: true });
    if (error) throw error;
    loanUpdates.set(data || []);
    return data || [];
  },
  async createLoanUpdate(loanId, updateData) {
    const user = await currentUser();
    const { error } = await supabase.from('loan_updates').insert({
      user_id: user.id,
      loan_id: loanId,
      updated_amortization: Number(updateData.updatedPayment),
      updated_interest_rate: Number(updateData.updatedRate),
      update_date: updateData.updateDate
    });
    if (error) throw error;
    await reloadRelatedData();
    showNotification('Payment/rate update added!', 'success');
    return true;
  },
  async updateLoanUpdate(loanId, updateId, updateData) {
    const user = await currentUser();
    const { error } = await supabase.from('loan_updates').update({
      updated_amortization: Number(updateData.updatedPayment),
      updated_interest_rate: Number(updateData.updatedRate),
      update_date: updateData.updateDate
    }).eq('id', updateId).eq('loan_id', loanId).eq('user_id', user.id);
    if (error) throw error;
    await reloadRelatedData();
    showNotification('Payment/rate update edited!', 'success');
    return true;
  },
  async deleteLoanUpdate(loanId, updateId) {
    const user = await currentUser();
    const { error } = await supabase.from('loan_updates').delete().eq('id', updateId).eq('loan_id', loanId).eq('user_id', user.id);
    if (error) throw error;
    await reloadRelatedData();
    showNotification('Payment/rate update deleted!', 'success');
    return true;
  }
};

export const oneTimePaymentService = {
  async fetchOneTimePayments(loanId = null) {
    const { data, error } = await supabase.from('one_time_payments').select('*').order('payment_date', { ascending: true });
    if (error) throw error;
    oneTimePayments.set(data || []);
    return loanId ? (data || []).filter((item) => item.loan_id === loanId) : (data || []);
  },
  async createOneTimePayment(loanId, paymentData) {
    const user = await currentUser();
    const { error } = await supabase.from('one_time_payments').insert({
      user_id: user.id,
      loan_id: loanId,
      amount: Number(paymentData.amount),
      payment_date: paymentData.paymentDate
    });
    if (error) throw error;
    await reloadRelatedData();
    showNotification('One-time payment added!', 'success');
    return true;
  },
  async deleteOneTimePayment(loanId, paymentId) {
    const user = await currentUser();
    const { error } = await supabase.from('one_time_payments').delete().eq('id', paymentId).eq('loan_id', loanId).eq('user_id', user.id);
    if (error) throw error;
    await reloadRelatedData();
    showNotification('One-time payment deleted!', 'success');
    return true;
  }
};

export const balanceAdjustmentService = {
  async fetchBalanceAdjustments(loanId = null) {
    const { data, error } = await supabase.from('loan_balance_adjustments').select('*').order('adjustment_date', { ascending: true });
    if (error) throw error;
    balanceAdjustments.set(data || []);
    return loanId ? (data || []).filter((item) => item.loan_id === loanId) : (data || []);
  },
  async createBalanceAdjustment(loanId, adjustmentData) {
    const user = await currentUser();
    const { error } = await supabase.from('loan_balance_adjustments').insert({
      user_id: user.id,
      loan_id: loanId,
      balance: Number(adjustmentData.balance),
      adjustment_date: adjustmentData.adjustmentDate,
      note: adjustmentData.note?.trim() || null
    });
    if (error) throw error;
    await reloadRelatedData();
    showNotification('Historical balance saved!', 'success');
    return true;
  },
  async updateBalanceAdjustment(loanId, adjustmentId, adjustmentData) {
    const user = await currentUser();
    const { error } = await supabase.from('loan_balance_adjustments').update({
      balance: Number(adjustmentData.balance),
      adjustment_date: adjustmentData.adjustmentDate,
      note: adjustmentData.note?.trim() || null
    }).eq('id', adjustmentId).eq('loan_id', loanId).eq('user_id', user.id);
    if (error) throw error;
    await reloadRelatedData();
    showNotification('Historical balance updated!', 'success');
    return true;
  },
  async deleteBalanceAdjustment(loanId, adjustmentId) {
    const user = await currentUser();
    const { error } = await supabase.from('loan_balance_adjustments').delete().eq('id', adjustmentId).eq('loan_id', loanId).eq('user_id', user.id);
    if (error) throw error;
    await reloadRelatedData();
    showNotification('Historical balance deleted!', 'success');
    return true;
  }
};

export const loanActions = {
  editLoan(loan) {
    editingLoan.set(loan);
    setTimeout(() => document.querySelector('.loan-form')?.scrollIntoView({ behavior: 'smooth' }), 0);
  },
  cancelEdit() { editingLoan.set(null); },
  async deleteLoan(loanId) {
    if (confirm('Are you sure you want to delete this loan?')) await loanService.deleteLoan(loanId);
  },
  expandLoan(loanId) {
    const current = get(expandedLoanId);
    expandedLoanId.set(current === loanId ? null : loanId);
  },
  collapseLoan() { expandedLoanId.set(null); },
  async submitLoan(data, loanId = null) {
    if (loanId) return loanService.updateLoan(loanId, data);
    return loanService.createLoan(data);
  },
  async loadLoans() { return loanService.fetchAllLoans(); }
};

export const formatCurrency = (amount) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(Number(amount) || 0);
export const formatDate = (dateString) => new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${String(dateString).slice(0, 10)}T00:00:00Z`));
