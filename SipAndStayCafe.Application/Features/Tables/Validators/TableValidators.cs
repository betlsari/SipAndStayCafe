using FluentValidation;
using SipAndStayCafe.Application.DTOs.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SipAndStayCafe.Application.Features.Tables.Validators
{
    public sealed class CreateTableRequestValidator : AbstractValidator<CreateTableRequest>
    {
        public CreateTableRequestValidator()
        {
            RuleFor(x => x.TableNumber).GreaterThan(0);
        }
    }
    public sealed class UpdateTableRequestValidator : AbstractValidator<UpdateTableRequest>
    {
        public UpdateTableRequestValidator()
        {
            RuleFor(x => x.TableNumber).GreaterThan(0);
        }
    }
}
