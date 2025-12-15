import { render, screen } from '../../utils/test-utils';
import Footer from '@/components/layout/Footer';

describe('Footer Component', () => {
  it('should render without crashing', () => {
    render(<Footer />);
  });

  it('should display current year in copyright', () => {
    const currentYear = new Date().getFullYear();
    render(<Footer />);

    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
    expect(screen.getByText(/BMAD7 课程选课系统/)).toBeInTheDocument();
  });

  it('should display system links', () => {
    render(<Footer />);

    expect(screen.getByText('关于我们')).toBeInTheDocument();
    expect(screen.getByText('使用帮助')).toBeInTheDocument();
    expect(screen.getByText('意见反馈')).toBeInTheDocument();
  });

  it('should have correct footer structure', () => {
    render(<Footer />);

    // Check for footer element
    const footerElement = screen.getByRole('contentinfo');
    expect(footerElement).toBeInTheDocument();
  });

  it('should display version information', () => {
    render(<Footer />);

    expect(screen.getByText(/版本/)).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });
});