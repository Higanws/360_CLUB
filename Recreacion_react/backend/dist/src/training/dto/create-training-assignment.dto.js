"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTrainingAssignmentDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateTrainingAssignmentDto {
}
exports.CreateTrainingAssignmentDto = CreateTrainingAssignmentDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateTrainingAssignmentDto.prototype, "routine_id", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Selecciona al menos un socio.' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.Min)(1, { each: true }),
    __metadata("design:type", Array)
], CreateTrainingAssignmentDto.prototype, "member_ids", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Selecciona al menos un entrenador.' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.Min)(1, { each: true }),
    __metadata("design:type", Array)
], CreateTrainingAssignmentDto.prototype, "trainer_member_ids", void 0);
//# sourceMappingURL=create-training-assignment.dto.js.map