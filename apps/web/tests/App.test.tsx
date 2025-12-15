import { render, screen } from '@testing-library/react'
import App from '../src/App'

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText(/BMAD7/i)).toBeInTheDocument()
  })

  it('displays the main navigation', () => {
    render(<App />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})