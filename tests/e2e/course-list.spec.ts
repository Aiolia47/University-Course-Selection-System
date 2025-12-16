import { test, expect, type Page } from '@playwright/test';

test.describe('Course List Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/v1/courses*', async route => {
      // Mock different responses based on query parameters
      const url = new URL(route.request().url());
      const searchParam = url.searchParams.get('search');

      if (searchParam) {
        // Mock search results
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              courses: [
                {
                  id: '1',
                  code: 'CS101',
                  name: '计算机科学导论',
                  description: '包含"计算机"的搜索结果课程',
                  credits: 3,
                  teacher: '张教授',
                  capacity: 100,
                  enrolled: 85,
                  status: 'published',
                  schedules: [{
                    dayOfWeek: ['monday', 'wednesday'],
                    startTime: '09:00',
                    endTime: '10:30',
                    location: '主教学楼 A101',
                    weeks: Array.from({ length: 16 }, (_, i) => i + 1),
                  }],
                  prerequisites: [],
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-15T00:00:00Z',
                }
              ],
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            }
          }),
        });
      } else {
        // Mock default course list
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              courses: [
                {
                  id: '1',
                  code: 'CS101',
                  name: '计算机科学导论',
                  description: '这是一门计算机科学的入门课程，涵盖基础概念和编程原理。',
                  credits: 3,
                  teacher: '张教授',
                  capacity: 100,
                  enrolled: 85,
                  status: 'published',
                  schedules: [{
                    dayOfWeek: ['monday', 'wednesday'],
                    startTime: '09:00',
                    endTime: '10:30',
                    location: '主教学楼 A101',
                    weeks: Array.from({ length: 16 }, (_, i) => i + 1),
                  }],
                  prerequisites: [],
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-15T00:00:00Z',
                },
                {
                  id: '2',
                  code: 'CS102',
                  name: '数据结构与算法',
                  description: '深入学习常用数据结构和算法设计与分析。',
                  credits: 4,
                  teacher: '李教授',
                  capacity: 80,
                  enrolled: 78,
                  status: 'published',
                  schedules: [{
                    dayOfWeek: ['tuesday', 'thursday'],
                    startTime: '14:00',
                    endTime: '15:30',
                    location: '实验楼 B201',
                    weeks: Array.from({ length: 16 }, (_, i) => i + 1),
                  }],
                  prerequisites: ['CS101'],
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-15T00:00:00Z',
                },
                {
                  id: '3',
                  code: 'CS103',
                  name: 'Web开发基础',
                  description: '学习HTML、CSS、JavaScript等Web开发基础技术。',
                  credits: 3,
                  teacher: '王教授',
                  capacity: 60,
                  enrolled: 45,
                  status: 'published',
                  schedules: [{
                    dayOfWeek: ['friday'],
                    startTime: '09:00',
                    endTime: '12:00',
                    location: '计算机实验室 C301',
                    weeks: Array.from({ length: 16 }, (_, i) => i + 1),
                  }],
                  prerequisites: [],
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-15T00:00:00Z',
                },
              ],
              page: 1,
              limit: 20,
              total: 3,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            }
          }),
        });
      }
    });

    // Mock authentication
    await page.goto('/courses');
    // Simulate logged in state
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
    });
  });

  test('displays course list correctly', async ({ page }) => {
    await page.goto('/courses');

    // Wait for course cards to load
    await page.waitForSelector('.course-card');

    // Verify course cards are displayed
    const courseCards = await page.locator('.course-card').count();
    expect(courseCards).toBe(3);

    // Verify first course details
    await expect(page.locator('.course-card').first()).toContainText('计算机科学导论');
    await expect(page.locator('.course-card').first()).toContainText('CS101');
    await expect(page.locator('.course-card').first()).toContainText('张教授');
    await expect(page.locator('.course-card').first()).toContainText('3 学分');
    await expect(page.locator('.course-card').first()).toContainText('85/100 人');

    // Verify status tags
    await expect(page.locator('.ant-tag-green')).toHaveCount(3); // All courses are published
  });

  test('search functionality works', async ({ page }) => {
    await page.goto('/courses');

    // Wait for course cards to load
    await page.waitForSelector('.course-card');

    // Enter search query
    await page.fill('input[placeholder*="搜索"]', '计算机');

    // Wait for debounced search (500ms) + API response
    await page.waitForTimeout(600);

    // Verify search results
    const searchResults = await page.locator('.course-card').count();
    expect(searchResults).toBe(1);

    await expect(page.locator('.course-card').first()).toContainText('计算机科学导论');
  });

  test('filter functionality works', async ({ page }) => {
    await page.goto('/courses');

    // Wait for course cards to load
    await page.waitForSelector('.course-card');

    // Open filter drawer
    await page.click('[data-testid="filter-button"]');

    // Wait for drawer to open
    await page.waitForSelector('.ant-drawer-content');

    // Select teacher filter
    await page.click('.ant-select-selector');
    await page.click('.ant-select-item-option:has-text("张教授")');

    // Apply filters
    await page.click('button:has-text("应用筛选")');

    // Wait for filter to be applied
    await page.waitForTimeout(500);

    // Verify filtered results
    const filteredResults = await page.locator('.course-card').count();
    expect(filteredResults).toBe(1);
  });

  test('favorite functionality works', async ({ page }) => {
    await page.goto('/courses');

    // Wait for course cards to load
    await page.waitForSelector('.course-card');

    // Click favorite button on first course
    await page.locator('.course-card').first().locator('.anticon-heart').click();

    // Verify heart icon is filled
    await expect(page.locator('.course-card').first().locator('.anticon-heart-filled')).toBeVisible();

    // Verify success message
    await expect(page.locator('.ant-message-success')).toBeVisible();
    await expect(page.locator('.ant-message-success')).toContainText('已添加到收藏');

    // Click again to unfavorite
    await page.locator('.course-card').first().locator('.anticon-heart-filled').click();

    // Verify heart icon is no longer filled
    await expect(page.locator('.course-card').first().locator('.anticon-heart:not(.anticon-heart-filled)')).toBeVisible();
  });

  test('compare functionality works', async ({ page }) => {
    await page.goto('/courses');

    // Wait for course cards to load
    await page.waitForSelector('.course-card');

    // Add first course to compare list
    await page.locator('.course-card').first().locator('.anticon-arrows-alt').click();

    // Verify success message
    await expect(page.locator('.ant-message-success')).toBeVisible();
    await expect(page.locator('.ant-message-success')).toContainText('已添加到对比列表');

    // Add second course to compare list
    await page.locator('.course-card').nth(1).locator('.anticon-arrows-alt').click();

    // Click compare button to open compare drawer
    await page.click('button:has-text("对比 (2/3)")');

    // Wait for compare drawer to open
    await page.waitForSelector('.ant-drawer-content');

    // Verify compare panel shows both courses
    await expect(page.locator('.compare-panel')).toContainText('计算机科学导论');
    await expect(page.locator('.compare-panel')).toContainText('数据结构与算法');

    // Clear compare list
    await page.click('button:has-text("清空对比")');

    // Verify drawer closes
    await expect(page.locator('.ant-drawer-content')).not.toBeVisible();
  });

  test('pagination works', async ({ page }) => {
    // Mock pagination response
    await page.route('**/api/v1/courses*', async route => {
      const url = new URL(route.request().url());
      const pageParam = url.searchParams.get('page');

      if (pageParam === '2') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              courses: [
                {
                  id: '4',
                  code: 'CS201',
                  name: '高级算法设计',
                  description: '高级算法课程',
                  credits: 4,
                  teacher: '赵教授',
                  capacity: 50,
                  enrolled: 30,
                  status: 'published',
                  schedules: [{
                    dayOfWeek: ['monday', 'wednesday', 'friday'],
                    startTime: '10:00',
                    endTime: '11:30',
                    location: '研究生楼 D101',
                    weeks: Array.from({ length: 16 }, (_, i) => i + 1),
                  }],
                  prerequisites: ['CS102'],
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-15T00:00:00Z',
                }
              ],
              page: 2,
              limit: 3,
              total: 7,
              totalPages: 3,
              hasNext: true,
              hasPrev: true,
            }
          }),
        });
      } else {
        // First page response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              courses: [
                {
                  id: '1',
                  code: 'CS101',
                  name: '计算机科学导论',
                  description: '课程1',
                  credits: 3,
                  teacher: '张教授',
                  capacity: 100,
                  enrolled: 85,
                  status: 'published',
                  schedules: [],
                  prerequisites: [],
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-15T00:00:00Z',
                },
                {
                  id: '2',
                  code: 'CS102',
                  name: '数据结构与算法',
                  description: '课程2',
                  credits: 4,
                  teacher: '李教授',
                  capacity: 80,
                  enrolled: 78,
                  status: 'published',
                  schedules: [],
                  prerequisites: [],
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-15T00:00:00Z',
                },
                {
                  id: '3',
                  code: 'CS103',
                  name: 'Web开发基础',
                  description: '课程3',
                  credits: 3,
                  teacher: '王教授',
                  capacity: 60,
                  enrolled: 45,
                  status: 'published',
                  schedules: [],
                  prerequisites: [],
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-15T00:00:00Z',
                }
              ],
              page: 1,
              limit: 3,
              total: 7,
              totalPages: 3,
              hasNext: true,
              hasPrev: false,
            }
          }),
        });
      }
    });

    await page.goto('/courses');

    // Wait for course cards to load
    await page.waitForSelector('.course-card');

    // Verify pagination info
    await expect(page.locator('.ant-pagination')).toContainText('第 1-3 条，共 7 条');

    // Click next page
    await page.click('.ant-pagination-next');

    // Wait for page 2 to load
    await page.waitForTimeout(500);

    // Verify new content
    await expect(page.locator('.course-card')).toContainText('高级算法设计');
    await expect(page.locator('.ant-pagination')).toContainText('第 4-6 条，共 7 条');
  });

  test('course details navigation works', async ({ page }) => {
    await page.goto('/courses');

    // Wait for course cards to load
    await page.waitForSelector('.course-card');

    // Click view details on first course
    await page.locator('.course-card').first().locator('.anticon-eye').click();

    // Verify navigation to course details page
    await expect(page).toHaveURL(/\/courses\/1/);
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/courses');

    // Wait for course cards to load
    await page.waitForSelector('.course-card');

    // Verify single column layout on mobile
    const courseCards = await page.locator('.course-card').count();
    expect(courseCards).toBe(3);

    // Verify mobile-specific elements
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await expect(searchInput).toBeVisible();

    // Check if grid changes to single column
    const firstCard = page.locator('.course-card').first();
    const firstCardBox = await firstCard.boundingBox();
    expect(firstCardBox?.width).toBeLessThan(400); // Should be narrow on mobile
  });

  test('error handling works', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/courses*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Internal server error',
        }),
      });
    });

    await page.goto('/courses');

    // Wait for error state
    await page.waitForSelector('.ant-alert-error');

    // Verify error message
    await expect(page.locator('.ant-alert-error')).toContainText('加载失败');

    // Verify retry button
    const retryButton = page.locator('button:has-text("重试")');
    await expect(retryButton).toBeVisible();
  });

  test('loading states work correctly', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/v1/courses*', async route => {
      // Wait 1 second before responding
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            courses: [],
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          }
        }),
      });
    });

    await page.goto('/courses');

    // Initially should show skeleton loading
    await expect(page.locator('.course-card-skeleton')).toBeVisible();

    // After loading, skeleton should disappear
    await page.waitForSelector('.course-card-skeleton', { state: 'hidden' });
  });
});