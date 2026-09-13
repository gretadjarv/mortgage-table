import { derived, get, writable } from 'svelte/store';
import { supabase, supabaseConfigured } from '$lib/supabase';
export { supabaseConfigured };
import { showNotification } from './notificationStore.js';

export const loans = writable([]);
export const loanUpdates = writable([]);
export const oneTimePayments = writable([]);
export const isLoading = writable(false);
export const editingLoan = writable(null);
export const expandedLoanId = writable(null);
export const isSubmittingForm = writable(false);
export const currentUser = writable(null);
export const authReady = writable(false);

export const loanList = derived(loans, ($loans) => $loans);
export const loading = derived(isLoading, ($isLoading) => $isLoading);
export const isEditing = derived(editingLoan, ($editingLoan) => !!$editingLoan);

async function requireUser() {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('You must be signed in.');
  currentUser.set(data.user);
  return data.user;
}

export async function initAuth() {
  if (!supabaseConfigured) {
    authReady.set(true);
    return null;
  }

  const { data } = await supabase.auth.getSession();
  currentUser.set(data.session?.user ?? null);
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser.set(session?.user ?? null);
  });
  authReady.set(true);
  return data.session?.user ?? null;
}

export const authService = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser.set(data.user);
    return data.user;
  },

  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    currentUser.set(data.session?.user ?? data.user ?? null);
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    currentUser.set(null);
    loans.set([]);
  }
};

export const loanService = {
  async fetchAllLoans() {
    isLoading.set(true);
    try {
      await requireUser();
      const { data, error } = await supabase.from('loans').select('*').order('id');
      if (error) throw error;
      loans.set(data ?? []);
      return data ?? [];
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to load loans.', 'error');
      throw error;
    } finally {
      isLoading.set(false);
    }
  },

  async createLoan(loanData) {
    isSubmittingForm.set(true);
    try {
      const user = await requireUser();
      const { data, error } = await supabase
        .from('loans')
        .insert({
          user_id: user.id,
          start_sum: Number(loanData.startAmount),
          interest_rate: Number(loanData.interestRate),
          amortization: Number(loanData.monthlyPayment),
          start_date: loanData.startDate
        })
        .select()
        .single();
      if (error) throw error;
      await this.fetchAllLoans();
      showNotification('Loan created successfully!', 'success');
      return data;
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to save loan.', 'error');
      throw error;
    } finally {
      isSubmittingForm.set(false);
    }
  },

  async updateLoan(loanId, loanData) {
    isSubmittingForm.set(true);
    try {
      await requireUser();
      const { error } = await supabase
        .from('loans')
        .update({
          start_sum: Number(loanData.startAmount),
          interest_rate: Number(loanData.interestRate),
          amortization: Number(loanData.monthlyPayment),
          start_date: loanData.startDate
        })
        .eq('id', loanId);
      if (error) throw error;
      await this.fetchAllLoans();
      editingLoan.set(null);
      showNotification('Loan updated successfully!', 'success');
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to save loan.', 'error');
      throw error;
    } finally {
      isSubmittingForm.set(false);
    }
  },

  async deleteLoan(loanId) {
    try {
      await requireUser();
      const { error } = await supabase.from('loans').delete().eq('id', loanId);
      if (error) throw error;
      await this.fetchAllLoans();
      editingLoan.set(null);
      expandedLoanId.set(null);
      showNotification('Loan deleted successfully!', 'success');
      return true;
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to delete loan.', 'error');
      throw error;
    }
  }
};

export const loanUpdateService = {
  async fetchLoanUpdates(loanId) {
    await requireUser();
    const { data, error } = await supabase
      .from('loan_updates')
      .select('*')
      .eq('loan_id', loanId)
      .order('update_date', { ascending: true });
    if (error) throw error;
    loanUpdates.set(data ?? []);
    return data ?? [];
  },

  async createLoanUpdate(loanId, updateData) {
    const user = await requireUser();
    const { error } = await supabase.from('loan_updates').insert({
      user_id: user.id,
      loan_id: loanId,
      updated_amortization: Number(updateData.updatedPayment),
      updated_interest_rate: Number(updateData.updatedRate),
      update_date: updateData.updateDate
    });
    if (error) throw error;
    await this.fetchLoanUpdates(loanId);
    showNotification('Payment update added successfully!', 'success');
  },

  async updateLoanUpdate(loanId, updateId, updateData) {
    await requireUser();
    const { error } = await supabase
      .from('loan_updates')
      .update({
        updated_amortization: Number(updateData.updatedPayment),
        updated_interest_rate: Number(updateData.updatedRate),
        update_date: updateData.updateDate
      })
      .eq('id', updateId)
      .eq('loan_id', loanId);
    if (error) throw error;
    await this.fetchLoanUpdates(loanId);
    showNotification('Payment update edited successfully!', 'success');
  },

  async deleteLoanUpdate(loanId, updateId) {
    await requireUser();
    const { error } = await supabase
      .from('loan_updates')
      .delete()
      .eq('id', updateId)
      .eq('loan_id', loanId);
    if (error) throw error;
    await this.fetchLoanUpdates(loanId);
    showNotification('Payment update deleted successfully!', 'success');
  }
};

export const oneTimePaymentService = {
  async fetchOneTimePayments(loanId) {
    await requireUser();
    const { data, error } = await supabase
      .from('one_time_payments')
      .select('*')
      .eq('loan_id', loanId)
      .order('payment_date', { ascending: true });
    if (error) throw error;
    oneTimePayments.set(data ?? []);
    return data ?? [];
  },

  async createOneTimePayment(loanId, paymentData) {
    const user = await requireUser();
    const { error } = await supabase.from('one_time_payments').insert({
      user_id: user.id,
      loan_id: loanId,
      amount: Number(paymentData.amount),
      payment_date: paymentData.paymentDate
    });
    if (error) throw error;
    await this.fetchOneTimePayments(loanId);
    showNotification('One-time payment added successfully!', 'success');
  },

  async deleteOneTimePayment(loanId, paymentId) {
    await requireUser();
    const { error } = await supabase
      .from('one_time_payments')
      .delete()
      .eq('id', paymentId)
      .eq('loan_id', loanId);
    if (error) throw error;
    await this.fetchOneTimePayments(loanId);
    showNotification('One-time payment deleted successfully!', 'success');
  }
};

export const loanActions = {
  editLoan(loan) {
    editingLoan.set(loan);
    setTimeout(() => document.querySelector('.loan-form')?.scrollIntoView({ behavior: 'smooth' }), 0);
  },
  cancelEdit() {
    editingLoan.set(null);
  },
  async deleteLoan(loanId) {
    if (confirm('Are you sure you want to delete this loan?')) await loanService.deleteLoan(loanId);
  },
  expandLoan(loanId) {
    expandedLoanId.update((current) => current === loanId ? null : loanId);
  },
  collapseLoan() {
    expandedLoanId.set(null);
  },
  async submitLoan(loanData, loanId = null) {
    if (loanId) return loanService.updateLoan(loanId, loanData);
    return loanService.createLoan(loanData);
  },
  async loadLoans() {
    return loanService.fetchAllLoans();
  }
};

export const formatCurrency = (amount) => new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  maximumFractionDigits: 0
}).format(Number(amount) || 0);

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long'
  });
};
