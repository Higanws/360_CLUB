"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRoles = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLES_KEY = 'business_roles';
const BusinessRoles = () => (0, common_1.SetMetadata)(exports.ROLES_KEY, ['administrator', 'staff_member']);
exports.BusinessRoles = BusinessRoles;
//# sourceMappingURL=roles.decorator.js.map