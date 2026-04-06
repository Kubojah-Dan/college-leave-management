import React, { useState } from 'react'
import api from '../services/api'

export default function LeaveForm({ token, onCreated }) {
  const [leaveType, setLeaveType] = useState('Sick')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  async function submit(e) {
    e.preventDefault()
    try {
      await api.post('/leaves', { leaveType, startDate, endDate, reason }, { headers: { Authorization: 'Bearer ' + token } })
      setLeaveType('Sick')
      setStartDate('')
      setEndDate('')
      setReason('')
      if (onCreated) onCreated()
    } catch (err) {
      console.error(err)
      alert('Failed to create leave')
    }
  }

  return (
    <form onSubmit={submit} className="leave-form">
      <h3>Apply for Leave</h3>
      <input value={leaveType} onChange={e => setLeaveType(e.target.value)} placeholder="Type" required />
      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
      <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason"></textarea>
      <button type="submit">Submit</button>
    </form>
  )
}
