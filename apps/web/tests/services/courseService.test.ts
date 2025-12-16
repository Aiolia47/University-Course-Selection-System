import { CourseService } from '@/services/courseService';
import { CourseFilters, CourseStatus } from '@/types/course';
import apiService from '@/services/api';

// Mock the apiService
jest.mock('@/services/api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('CourseService', () => {
  let courseService: CourseService;

  beforeEach(() => {
    jest.clearAllMocks();
    courseService = new CourseService();
  });

  describe('getCourses', () => {
    it('should fetch courses with default parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockedApiService.get.mockResolvedValue(mockResponse);

      const result = await courseService.getCourses();

      expect(mockedApiService.get).toHaveBeenCalledWith('/courses');
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch courses with filters', async () => {
      const filters: CourseFilters = {
        search: '计算机',
        teacher: '张教授',
        status: CourseStatus.PUBLISHED,
        minCredits: 2,
        maxCredits: 4,
      };

      const mockResponse = {
        success: true,
        data: {
          data: [],
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockedApiService.get.mockResolvedValue(mockResponse);

      const result = await courseService.getCourses({
        page: 2,
        limit: 20,
        filters,
        sortBy: 'name',
        sortOrder: 'ASC',
      });

      expect(mockedApiService.get).toHaveBeenCalledWith(
        '/courses?search=计算机&teacher=张教授&status=published&minCredits=2&maxCredits=4&page=2&limit=20&sortBy=name&sortOrder=ASC'
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getCourseById', () => {
    it('should fetch a course by ID', async () => {
      const mockCourse = {
        id: '1',
        code: 'CS101',
        name: '计算机科学导论',
        description: '测试描述',
        credits: 3,
        teacher: '张教授',
        capacity: 100,
        enrolled: 0,
        status: CourseStatus.PUBLISHED,
        schedules: [],
        prerequisites: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockCourse,
      };

      mockedApiService.get.mockResolvedValue(mockResponse);

      const result = await courseService.getCourseById('1');

      expect(mockedApiService.get).toHaveBeenCalledWith('/courses/1');
      expect(result).toEqual(mockCourse);
    });
  });

  describe('searchCourses', () => {
    it('should search courses with query', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockedApiService.get.mockResolvedValue(mockResponse);

      const result = await courseService.searchCourses('计算机', { page: 1, limit: 20 });

      expect(mockedApiService.get).toHaveBeenCalledWith('/courses/search?search=计算机&page=1&limit=20');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getPopularCourses', () => {
    it('should fetch popular courses with default limit', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockedApiService.get.mockResolvedValue(mockResponse);

      const result = await courseService.getPopularCourses();

      expect(mockedApiService.get).toHaveBeenCalledWith('/courses/popular?limit=10');
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch popular courses with custom limit', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          page: 1,
          limit: 5,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockedApiService.get.mockResolvedValue(mockResponse);

      const result = await courseService.getPopularCourses(5);

      expect(mockedApiService.get).toHaveBeenCalledWith('/courses/popular?limit=5');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getCoursesByTeacher', () => {
    it('should fetch courses by teacher name', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockedApiService.get.mockResolvedValue(mockResponse);

      const result = await courseService.getCoursesByTeacher('张教授', 1, 20);

      expect(mockedApiService.get).toHaveBeenCalledWith('/courses/teacher/张教授?page=1&limit=20');
      expect(result).toEqual(mockResponse.data);
    });

    it('should encode teacher name in URL', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockedApiService.get.mockResolvedValue(mockResponse);

      await courseService.getCoursesByTeacher('John Doe Professor', 1, 20);

      expect(mockedApiService.get).toHaveBeenCalledWith('/courses/teacher/John%20Doe%20Professor?page=1&limit=20');
    });
  });

  describe('exportCourses', () => {
    it('should export courses as CSV', async () => {
      const mockBlob = new Blob(['csv content'], { type: 'text/csv' });
      const mockClient = {
        get: jest.fn().mockResolvedValue({ data: mockBlob }),
      };
      jest.spyOn(apiService, 'getClient').mockReturnValue(mockClient as any);

      const filters: CourseFilters = {
        teacher: '张教授',
        status: CourseStatus.PUBLISHED,
      };

      const result = await courseService.exportCourses('csv', filters);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/courses/export?format=csv&teacher=张教授&status=published',
        { responseType: 'blob' }
      );
      expect(result).toBe(mockBlob);
    });

    it('should export courses without filters', async () => {
      const mockBlob = new Blob(['excel content'], { type: 'application/vnd.ms-excel' });
      const mockClient = {
        get: jest.fn().mockResolvedValue({ data: mockBlob }),
      };
      jest.spyOn(apiService, 'getClient').mockReturnValue(mockClient as any);

      const result = await courseService.exportCourses('excel');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/courses/export?format=excel',
        { responseType: 'blob' }
      );
      expect(result).toBe(mockBlob);
    });
  });

  describe('getRecommendations', () => {
    it('should fetch course recommendations for a student', async () => {
      const mockCourses = [
        {
          id: '1',
          code: 'CS101',
          name: '计算机科学导论',
          description: '测试描述',
          credits: 3,
          teacher: '张教授',
          capacity: 100,
          enrolled: 0,
          status: CourseStatus.PUBLISHED,
          schedules: [],
          prerequisites: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockResponse = {
        success: true,
        data: mockCourses,
      };

      mockedApiService.get.mockResolvedValue(mockResponse);

      const result = await courseService.getRecommendations('student123', 5);

      expect(mockedApiService.get).toHaveBeenCalledWith('/courses/recommendations?studentId=student123&limit=5');
      expect(result).toEqual(mockCourses);
    });
  });

  describe('cache operations', () => {
    beforeEach(() => {
      // Mock IndexedDB
      const mockRequest = {
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        result: {
          objectStoreNames: {
            contains: jest.fn().mockReturnValue(false),
          },
          createObjectStore: jest.fn(),
          transaction: jest.fn().mockReturnValue({
            objectStore: jest.fn().mockReturnValue({
              put: jest.fn(),
              get: jest.fn(),
              getAll: jest.fn().mockReturnValue({
                onsuccess: null,
                onerror: null,
                result: [],
              }),
            }),
          }),
        },
      };

      global.indexedDB = {
        open: jest.fn().mockReturnValue(mockRequest),
      } as any;
    });

    it('should cache courses to IndexedDB when available', async () => {
      const mockCourses = [
        {
          id: '1',
          code: 'CS101',
          name: '计算机科学导论',
          description: '测试描述',
          credits: 3,
          teacher: '张教授',
          capacity: 100,
          enrolled: 0,
          status: CourseStatus.PUBLISHED,
          schedules: [],
          prerequisites: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock successful IndexedDB operations
      const mockOpenRequest = global.indexedDB.open('CourseCacheDB', 1);
      if (mockOpenRequest.onsuccess) {
        setTimeout(() => {
          mockOpenRequest.onsuccess!({ target: { result: mockOpenRequest.result } } as any);
        }, 0);
      }

      await courseService.cacheCourses(mockCourses);

      expect(global.indexedDB.open).toHaveBeenCalledWith('CourseCacheDB', 1);
    });

    it('should handle missing IndexedDB gracefully', async () => {
      // Temporarily remove IndexedDB
      const originalIndexedDB = global.indexedDB;
      delete (global as any).indexedDB;

      const mockCourses = [];

      // Should not throw error
      await expect(courseService.cacheCourses(mockCourses)).resolves.toBeUndefined();

      // Restore IndexedDB
      global.indexedDB = originalIndexedDB;
    });
  });

  describe('error handling', () => {
    it('should propagate API errors', async () => {
      const mockError = new Error('Network error');
      mockedApiService.get.mockRejectedValue(mockError);

      await expect(courseService.getCourseById('1')).rejects.toThrow('Network error');
      expect(mockedApiService.get).toHaveBeenCalledWith('/courses/1');
    });
  });
});