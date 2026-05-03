import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from 'src/configuration/jwt/interfaces/jwt-payload.interface';
import { RoleService } from 'src/resources/rbac/services/role.service';
import { ActionName } from 'src/common/enums/actions.enum';
import { ResourceName } from 'src/common/enums/resources.enum';
import { SKIP_ROUTE_PROTECTION } from 'src/common/decorators/route-protection.decorator';
import { IS_PUBLIC_KEY } from 'src/configuration/jwt/public.decorator';

@Injectable()
export class RouteProtectionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public (JWT guard handles this too)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check if route protection should be skipped
    const skipProtection = this.reflector.getAllAndOverride<boolean>(
      SKIP_ROUTE_PROTECTION,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || skipProtection) {
      return true; // Allow access to public routes without any checks
    }

    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // Skip protection for authentication routes (login, callback, etc.)
    if (url.includes('/auth/') && (
      url.includes('/login') ||
      url.includes('/callback') ||
      url.includes('/logout') ||
      url.includes('/employee/login') ||
      url.includes('/employee/select-organization')
    )) {
      return true;
    }
    const user: JwtPayload = request.user;

    // JWT guard has already verified authentication
    // Just ensure user object exists (should always be true after JWT guard)
    if (!user?.role) {
      return true; // Allow access if something is wrong, don't block
    }

    try {
      // Extract resource and action from the request
      const { resource, action } = this.extractResourceAndAction(
        context,
        request,
      );

      // Skip protection if we can't determine resource/action
      if (!resource || !action) {
        return true;
      }

      // Get user's permissions for this resource
      const permissions = await this.roleService.getActionsForResource(
        user.role,
        resource,
      );

      // Check if user has the required action permission
      const hasPermission = permissions.includes(action);

      if (!hasPermission) {
        throw new ForbiddenException(
          `Forbidden. Insufficient permissions for this operation`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // Allow access if something goes wrong with permission checking
      return true; // Graceful fallback - don't block access on errors
    }
  }

  private extractResourceAndAction(
    context: ExecutionContext,
    request: any,
  ): { resource: ResourceName | null; action: ActionName | null } {
    const httpMethod = request.method.toLowerCase();
    const url = request.url;
    const controllerClass = context.getClass();
    const controllerName = controllerClass.name.toLowerCase();

    // Extract resource from controller name or URL
    const resource = this.extractResource(controllerName, url);

    // Map HTTP method to action
    const action = this.mapHttpMethodToAction(httpMethod, url);

    return { resource, action };
  }

  private extractResource(
    controllerName: string,
    url: string,
  ): ResourceName | null {
    // Check if URL contains module names (simplified detection)
    const urlModuleMap: Record<string, ResourceName> = {
      'crm/companies': ResourceName.CRM_COMPANIES,
      'crm/contacts': ResourceName.CRM_CONTACTS,
      'crm/deals': ResourceName.CRM_DEALS,
      'crm/activities': ResourceName.CRM_ACTIVITIES,
      'crm/activities-log': ResourceName.CRM_ACTIVITIES,
      users: ResourceName.USERS,
      roles: ResourceName.ROLES,
      actions: ResourceName.ACTIONS,
      resources: ResourceName.RESOURCES,
      organizations: ResourceName.ORGANIZATIONS,
      employees: ResourceName.EMPLOYEES,
      enquiries: ResourceName.ENQUIRIES,
      feedbacks: ResourceName.FEEDBACKS,
      'audit-logs': ResourceName.AUDIT_LOGS,
      analytics: ResourceName.ANALYTICS,
      notifications: ResourceName.NOTIFICATIONS,
      overview: ResourceName.OVERVIEW,
      profiles: ResourceName.PROFILES,
      settings: ResourceName.SETTINGS,
      rbac: ResourceName.RBAC,
      assets: ResourceName.ASSETS,
      subscriptions: ResourceName.SUBSCRIPTIONS,
      invoices: ResourceName.INVOICES,
      tickets: ResourceName.TICKETS,
      sprints: ResourceName.SPRINTS,
      boards: ResourceName.BOARDS,
      projects: ResourceName.PROJECTS,
      'finance/tax-rates': ResourceName.FIN_TAX_RATES,
      'finance/products': ResourceName.FIN_PRODUCTS,
      'finance/vendors': ResourceName.FIN_VENDORS,
      'finance/invoices': ResourceName.FIN_INVOICES,
      'finance/estimates': ResourceName.FIN_ESTIMATES,
      'finance/recurring-invoices': ResourceName.FIN_RECURRING_INVOICES,
      'finance/expense-categories': ResourceName.FIN_EXPENSE_CATEGORIES,
      'finance/expenses': ResourceName.FIN_EXPENSES,
      'finance/dashboard': ResourceName.FIN_INVOICES,
      'finance/reports': ResourceName.FIN_INVOICES,
      'finance/activities': ResourceName.FIN_INVOICES,
      'finance/export': ResourceName.FIN_INVOICES,
      'finance/import': ResourceName.FIN_INVOICES,
      'hr/departments': ResourceName.HR_DEPARTMENTS,
      'hr/designations': ResourceName.HR_DESIGNATIONS,
      'hr/leave-types': ResourceName.HR_LEAVE_TYPES,
      'hr/leave-requests': ResourceName.HR_LEAVE_REQUESTS,
      'hr/leave-balances': ResourceName.HR_LEAVE_BALANCES,
      'hr/attendance': ResourceName.HR_ATTENDANCE,
      'hr/payroll': ResourceName.HR_PAYROLL,
      'hr/announcements': ResourceName.HR_ANNOUNCEMENTS,
      'hr/documents': ResourceName.HR_DOCUMENTS,
      'hr/dashboard': ResourceName.HR_DASHBOARD,
    };

    // Check if URL contains any of the module names
    for (const [moduleName, resource] of Object.entries(urlModuleMap)) {
      if (url.includes(`/${moduleName}`)) {
        return resource;
      }
    }

    return null;
  }

  private mapHttpMethodToAction(
    method: string,
    url: string,
  ): ActionName | null {
    const lowerMethod = method.toLowerCase();

    // Special URL patterns that override default method mapping
    if (url.includes('/restore')) {
      return ActionName.UPDATE;
    }
    if (url.includes('/force')) {
      return ActionName.DELETE;
    }
    if (url.includes('/export')) {
      return ActionName.EXPORT;
    }
    if (url.includes('/import')) {
      return ActionName.IMPORT;
    }

    // Standard HTTP method to action mapping
    const methodActionMap: Record<string, ActionName> = {
      get: ActionName.READ,
      post: ActionName.CREATE,
      put: ActionName.UPDATE,
      patch: ActionName.UPDATE,
      delete: ActionName.DELETE,
    };

    // Check if it's a GET request for collection (LIST operation)
    if (lowerMethod === 'get') {
      // Remove query parameters and split path
      const cleanUrl = url.split('?')[0];
      const pathSegments = cleanUrl.split('/').filter(Boolean);

      // If URL ends with module name (no ID), it's a LIST operation
      // Examples: /api/v1/users, /api/v1/rbac/roles
      const lastSegment = pathSegments[pathSegments.length - 1];
      const isId = /^\d+$/.test(lastSegment) || lastSegment.length > 10;

      if (!isId) {
        return ActionName.LIST;
      }

      return ActionName.READ; // GET with ID = READ single item
    }

    return methodActionMap[lowerMethod] || null;
  }
}
