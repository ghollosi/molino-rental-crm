import { render, screen } from '@testing-library/react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

describe('Card Components', () => {
  it('should render card with all parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Test content</p>
        </CardContent>
        <CardFooter>
          <p>Test footer</p>
        </CardFooter>
      </Card>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
    expect(screen.getByText('Test footer')).toBeInTheDocument()
  })

  it('should apply correct CSS classes', () => {
    const { container } = render(
      <Card className="custom-class">
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'custom-class')
  })

  it('should render card header with proper structure', () => {
    render(
      <CardHeader>
        <CardTitle>Header Title</CardTitle>
        <CardDescription>Header Description</CardDescription>
      </CardHeader>
    )

    const title = screen.getByText('Header Title')
    const description = screen.getByText('Header Description')

    expect(title).toBeInTheDocument()
    expect(description).toBeInTheDocument()
  })

  it('should render minimal card', () => {
    render(
      <Card>
        <CardContent>
          Simple content
        </CardContent>
      </Card>
    )

    expect(screen.getByText('Simple content')).toBeInTheDocument()
  })
})