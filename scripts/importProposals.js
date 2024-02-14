"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var prisma_client_1 = require("@charmverse/core/prisma-client");
var uuid_1 = require("uuid");
// Import rows from a CSV that answer questions on a proposal template
var templateId = '23630cb0-8a55-4bea-acf5-0f65579302e4';
var csvFile = './TEST_Charmverse_Grants.csv';
var csvColumnToQuestion = {
    // unused
    'Contact type': 'Contact type',
    'Conversion Date': 'Conversion Date',
    'Conversion Page': 'Conversion Page',
    'Conversion Title': 'Conversion Title',
    'Litepaper/Whitepaper': 'Litepaper/Whitepaper',
    'Grant Description': 'Grant Description',
    'Grant Goals': 'Grant Goals',
    // special handle map these to Name of primary point of contact
    Email: 'Email',
    'First name': 'First name',
    'Last name': 'Last name',
    Title: 'Project Name',
    'About You': 'Tell us about yourself.',
    'Grant Category': 'Grant Category',
    'Website URL': 'Please include links to Litepaper, Whitepaper or Additional Links/URL for your project or yourself.',
    'Positive Impact Measurement': 'If applicable; Please provide information regarding how you will measure the positive impact your project will generate. (Tools, Metrics,etc)',
    'Funding Request': 'Funding Request: Tell us how much USD you require for your project?',
    'Budget Breakdown': 'Describe how the funds will be used',
    'Grant Timeline': 'Grant Timeline - Describe expected timeline for Grant completion',
    'How will your project drive KYOTO value?': 'How will your project drive value to Kyoto?',
    'Does your project already exist on other chains?': 'Does your project already exist on other chains? If yes, which chains?',
    'Has your project received grants and/or VC funding from any other entity?': 'Have you received grants and/or VC funding from any other entity? If yes, please provide details.',
    'KYOTO Wallet Address (or compatible EVM wallet address)': 'KYOTO Wallet Address (or compatible EVM wallet address)',
    'Additional Links': 'Please provide links to demo and any other applicable links:',
    'Other Information': 'Please provide any other information that you feel would strengthen your application:',
    Referral: 'How were you referred to this program?'
};
function getFieldName(column) {
    return csvColumnToQuestion[column];
}
function getUserByEmail(email, spaceId) {
    return __awaiter(this, void 0, void 0, function () {
        var userId, user, user_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_client_1.prisma.user.findFirst({
                        where: {
                            email: email
                        }
                    })];
                case 1:
                    user = _a.sent();
                    if (!user) return [3 /*break*/, 2];
                    userId = user.id;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, prisma_client_1.prisma.user.create({
                        data: {
                            username: email,
                            path: (0, uuid_1.v4)(),
                            spaceRoles: {
                                create: [
                                    {
                                        spaceId: spaceId
                                    }
                                ]
                            },
                            verifiedEmails: {
                                create: [
                                    {
                                        email: email,
                                        name: '',
                                        avatarUrl: ''
                                    }
                                ]
                            }
                        }
                    })];
                case 3:
                    user_1 = _a.sent();
                    userId = user_1.id;
                    console.log('created user for email', email, 'with id', userId);
                    _a.label = 4;
                case 4: return [2 /*return*/, userId];
            }
        });
    });
}
function getDataFromCSV() {
    var content = (0, fs_1.readFileSync)(csvFile).toString();
    var _a = content.split('\n'), headers = _a[0], rows = _a.slice(1);
    return rows.map(function (row) {
        return row.split(',').reduce(function (acc, field, index) {
            var header = headers[index];
            var fieldName = getFieldName(header);
            if (fieldName) {
                acc[fieldName] = field;
            }
            else {
                console.error('no field name for header', header);
            }
            return acc;
        }, {});
    });
}
function importCSV() {
    return __awaiter(this, void 0, void 0, function () {
        var rows, page, _i, rows_1, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rows = getDataFromCSV();
                    return [4 /*yield*/, prisma_client_1.prisma.page.findUniqueOrThrow({
                            where: {
                                id: templateId
                            },
                            include: {
                                proposal: {
                                    include: {
                                        form: true
                                    }
                                }
                            }
                        })];
                case 1:
                    page = _a.sent();
                    for (_i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                        row = rows_1[_i];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// The following code is to retrieve and import the proposal from production
var templateJson = './proposal_template.json';
var importToSpaceDomain = 'binding-amaranth-manatee';
function templateQuery() {
    return prisma_client_1.prisma.page.findUniqueOrThrow({
        where: {
            id: templateId
        },
        include: {
            proposal: {
                include: {
                    evaluations: true,
                    rubricCriteria: true,
                    form: {
                        include: {
                            formFields: true
                        }
                    }
                }
            }
        }
    });
}
function downloadTemplate() {
    return __awaiter(this, void 0, void 0, function () {
        var template;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, templateQuery()];
                case 1:
                    template = _a.sent();
                    // write template to file
                    (0, fs_1.writeFileSync)(templateJson, JSON.stringify(template, null, 2));
                    return [2 /*return*/];
            }
        });
    });
}
// read file and import to local database
function importTemplate() {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var content, template, space, newUserId, proposalTemplate, page, _b, evaluations, rubricCriteria, formTemplate, proposal, _c, formFields, form;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    content = (0, fs_1.readFileSync)(templateJson).toString();
                    template = JSON.parse(content);
                    return [4 /*yield*/, prisma_client_1.prisma.space.findUniqueOrThrow({
                            where: {
                                domain: importToSpaceDomain
                            },
                            include: {
                                spaceRoles: true
                            }
                        })];
                case 1:
                    space = _d.sent();
                    newUserId = ((_a = space.spaceRoles[0]) === null || _a === void 0 ? void 0 : _a.userId) || '';
                    template.spaceId = space.id;
                    template.createdBy = newUserId;
                    template.updatedBy = newUserId;
                    template.proposal.createdBy = newUserId;
                    template.proposal.spaceId = space.id;
                    template.proposal.workflowId = null;
                    proposalTemplate = template.proposal, page = __rest(template, ["proposal"]);
                    _b = proposalTemplate, evaluations = _b.evaluations, rubricCriteria = _b.rubricCriteria, formTemplate = _b.form, proposal = __rest(_b, ["evaluations", "rubricCriteria", "form"]);
                    _c = formTemplate, formFields = _c.formFields, form = __rest(_c, ["formFields"]);
                    // save the page, proposal, form, rubricCriteria, evaluations, and formFields
                    return [4 /*yield*/, prisma_client_1.prisma.$transaction([
                            prisma_client_1.prisma.page.delete({
                                where: {
                                    id: page.id
                                }
                            }),
                            prisma_client_1.prisma.form.create({
                                data: form
                            }),
                            prisma_client_1.prisma.proposal.create({
                                data: __assign(__assign({}, proposal), { fields: proposal.fields })
                            }),
                            prisma_client_1.prisma.page.create({
                                data: __assign(__assign({}, page), { content: page.content })
                            }),
                            prisma_client_1.prisma.proposalEvaluation.createMany({
                                data: evaluations.map(function (e) { return (__assign(__assign({}, e), { voteSettings: e.voteSettings })); })
                            }),
                            prisma_client_1.prisma.proposalRubricCriteria.createMany({
                                data: rubricCriteria.map(function (c) { return (__assign(__assign({}, c), { parameters: c.parameters })); })
                            }),
                            prisma_client_1.prisma.formField.createMany({
                                data: formFields.map(function (f) { return (__assign(__assign({}, f), { description: f.description, options: f.options })); })
                            })
                        ])];
                case 2:
                    // save the page, proposal, form, rubricCriteria, evaluations, and formFields
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
//downloadTemplate().catch((e) => console.error(e));
//importTemplate().catch((e) => console.error(e));
var rows = getDataFromCSV();
console.log(rows[0]);
