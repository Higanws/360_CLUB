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
exports.TrainingRoutineLineDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class TrainingRoutineLineDto {
}
exports.TrainingRoutineLineDto = TrainingRoutineLineDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], TrainingRoutineLineDto.prototype, "activity_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === '' || value === undefined || value === null)
            return null;
        const n = typeof value === 'number'
            ? value
            : Number(String(value).replace(',', '.'));
        if (!Number.isFinite(n))
            return null;
        return Math.round(n * 100) / 100;
    }),
    (0, class_validator_1.ValidateIf)((_, v) => v !== null && v !== undefined),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(999.99),
    __metadata("design:type", Object)
], TrainingRoutineLineDto.prototype, "weight_kg", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === '' || value === undefined || value === null)
            return 127;
        const n = typeof value === 'number'
            ? value
            : parseInt(String(value).replace(/\s/g, ''), 10);
        if (!Number.isFinite(n))
            return 127;
        const masked = Math.floor(n) & 127;
        return masked < 1 ? 127 : masked;
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(127),
    __metadata("design:type", Number)
], TrainingRoutineLineDto.prototype, "weekdays_mask", void 0);
//# sourceMappingURL=training-routine-line.dto.js.map